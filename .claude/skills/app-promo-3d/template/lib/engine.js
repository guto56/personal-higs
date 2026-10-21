/*
 * engine.js — motor do comercial de app em 3D (app-promo-3d).
 *
 * - iPhone 3D (Three.js, GLB) com a tela em HTML real mapeada por homografia (CSS matrix3d) sobre o vidro:
 *   texto nítido em qualquer zoom e a tela é DOM comum (fácil de animar).
 * - Câmera única contínua: alvo (ponto do mundo OU ponto da tela em pt), distância em log, guinada, inclinação,
 *   deslocamento de quadro (fx) para compor o celular fora do centro sem mexer na órbita.
 * - Ponteiro de toque, teclado iOS, tempos de digitação humanizados e lista de SFX exportada (window.__sfx).
 *
 * Tudo é função pura do tempo T: render(T) pode ser chamado em qualquer ordem (captura paralela).
 * Requer: three.min.js (r147), GLTFLoader.js, motion-lite.js (window.OM).
 */
(function (root) {
  var OM = root.OM, E = OM.ease, clamp = OM.clamp, lerp = OM.lerp, seg = OM.seg, sstep = OM.sstep;
  var PI = Math.PI;

  // ───────────── utilidades ─────────────
  function mix(a, b, k) { if (typeof a === "number") return a + (b - a) * k; var o = []; for (var i = 0; i < a.length; i++) o.push(a[i] + (b[i] - a[i]) * k); return o; }
  // keys: [[t, valor, easeDoTrechoQueTerminaAqui?], ...]
  function track(T, keys) {
    if (T <= keys[0][0]) return keys[0][1];
    for (var i = 1; i < keys.length; i++) if (T <= keys[i][0]) { var a = keys[i - 1], b = keys[i]; return mix(a[1], b[1], (b[2] || E.cubicInOut)((T - a[0]) / (b[0] - a[0]))); }
    return keys[keys.length - 1][1];
  }
  function css(el, o) {
    if (o.op !== undefined) el.style.opacity = o.op;
    var t = "";
    if (o.x !== undefined || o.y !== undefined) t += "translate(" + (o.x || 0) + "px," + (o.y || 0) + "px) ";
    if (o.r !== undefined) t += "rotate(" + o.r + "deg) ";
    if (o.s !== undefined) t += "scale(" + o.s + ") ";
    if (o.sx !== undefined) t += "scale(" + o.sx + "," + (o.sy === undefined ? 1 : o.sy) + ") ";
    el.style.transform = t;
    // blur só em sobreposições 2D. Nunca dentro da tela do celular ampliada (derruba o WebGL — ver pitfalls.md)
    if (o.blur !== undefined) el.style.filter = o.blur > 0.05 ? "blur(" + o.blur.toFixed(2) + "px)" : "none";
  }
  function vis(el, on) { el.style.visibility = on ? "visible" : "hidden"; }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function words(el, arr) { el.innerHTML = ""; return arr.map(function (w) { var s = h("span", "", w); s.style.display = "inline-block"; s.style.whiteSpace = "pre"; el.appendChild(s); return s; }); }
  function beatPulse(T, t0, beat, decay) { if (T < t0) return 0; var ph = ((T - t0) % beat) / beat; return Math.exp(-ph * (decay || 6)); }
  function tapPulse(T, t) { if (T < t) return 0; return Math.exp(-(T - t) * 12) * Math.sin(Math.min(1, (T - t) / 0.14) * PI); }

  // ───────────── digitação ─────────────
  function keyTimes(s, t0, t1, seed) {
    var r = OM.rng(seed || 7), raw = [], acc = 0;
    for (var i = 0; i < s.length; i++) { acc += 0.7 + r() * 0.6 + (s[i] === " " ? 0.35 : 0); raw.push(acc); }
    return raw.map(function (v) { return t0 + (v - raw[0]) / (acc - raw[0] || 1) * (t1 - t0); });
  }
  function typed(T, K) { var n = 0; while (n < K.length && K[n] <= T) n++; return n; }
  function typedF(T, K) { var n = typed(T, K); if (n === 0) return 0; if (n >= K.length) return K.length; return n - 1 + (T - K[n - 1]) / (K[n] - K[n - 1]); }

  // ───────────── SFX (lidos por scripts/mix.py via window.__sfx) ─────────────
  var SFX = {
    list: [],
    // nome = arquivo em assets/sfx sem .mp3; o = { gain, rate, dur, pan }
    add: function (name, t, gain, o) { o = o || {}; this.list.push({ sfx: name, t: +t.toFixed(4), gain: gain === undefined ? 0.5 : gain, rate: o.rate || 1, dur: o.dur || 0, pan: o.pan || 0 }); return this; },
    keys: function (K, gain, pan) { var r = OM.rng(3); for (var i = 0; i < K.length; i++) this.add("key-press", K[i], gain || 0.28, { dur: 0.12, rate: 0.9 + r() * 0.25, pan: pan || 0 }); return this; },
    publish: function () { root.__sfx = this.list.slice().sort(function (a, b) { return a.t - b.t; }); }
  };

  // ───────────── teclado iOS 26 (vidro escuro) ─────────────
  // Monta dentro de `el` (posicionado na tela, coordenadas em pt). Retorna { keys, press(T, K, text) }.
  function buildKeyboard(el, goLabelHtml) {
    var keyEls = {};
    function key(label, x, y, w, cls, id) {
      var k = h("div", "key" + (cls ? " " + cls : ""), label + '<div class="pop">' + label + "</div>");
      k.style.left = x + "px"; k.style.top = y + "px"; k.style.width = w + "px"; el.appendChild(k); keyEls[id || label] = k; return k;
    }
    "qwertyuiop".split("").forEach(function (c, i) { key(c, 4 + i * 37.6, 14, 33); });
    "asdfghjkl".split("").forEach(function (c, i) { key(c, 22.8 + i * 37.6, 68, 33); });
    key("⇧", 4, 122, 44, "dk", "shift");
    "zxcvbnm".split("").forEach(function (c, i) { key(c, 60.8 + i * 37.6, 122, 33); });
    key("⌫", 330, 122, 44, "dk", "del");
    key("123", 4, 176, 46, "dk", "num"); key("☺", 54, 176, 40, "dk", "emo"); key("", 98, 176, 186, "", "space");
    var go = key(goLabelHtml || "ir", 288, 176, 86, "", "go"); go.style.background = "#3478f6";
    function keyOf(ch) {
      var m = { "ú": "u", "ù": "u", "à": "a", "á": "a", "ã": "a", "â": "a", "é": "e", "ê": "e", "í": "i", "ó": "o", "ô": "o", "õ": "o", "ç": "c", " ": "space" };
      ch = m[ch] || ch.toLowerCase(); if (/[0-9]/.test(ch)) return "num"; return keyEls[ch] ? ch : null;
    }
    return {
      keys: keyEls,
      press: function (T, K, text) {
        var n = typed(T, K), id = null;
        if (n > 0 && T - K[n - 1] < 0.085) id = keyOf(text[n - 1]);
        for (var k in keyEls) { var e = keyEls[k], on = k === id; e.style.background = on ? "rgba(255,255,255,.55)" : (k === "go" ? "#3478f6" : ""); e.querySelector(".pop").style.opacity = on && k !== "space" && k !== "go" ? 1 : 0; }
      }
    };
  }

  // ───────────── ponteiro de toque ─────────────
  // taps: [{ t, u, v, size, tin, tout, from:[u,v] }] em pt da tela
  function pointer(T, ptr, rip, taps) {
    var on = false;
    for (var i = 0; i < taps.length; i++) {
      var tp = taps[i], t = tp.t;
      if (T < tp.tin || T > tp.tout) continue;
      on = true;
      var k = E.cubicOut(seg(T, tp.tin, t - 0.03));
      var cx = lerp(tp.from[0], tp.u, k) + Math.sin(k * PI) * 30, cy = lerp(tp.from[1], tp.v, k) + Math.sin(k * PI) * 18;
      var fade = Math.min(seg(T, tp.tin, tp.tin + 0.1), 1 - seg(T, tp.tout - 0.1, tp.tout));
      var sz = tp.size || 24;
      ptr.style.width = ptr.style.height = sz + "px"; ptr.style.margin = (-sz / 2) + "px 0 0 " + (-sz / 2) + "px";
      css(ptr, { x: cx, y: cy, s: (T >= t - 0.05 && T <= t + 0.14) ? 0.84 + 0.16 * (T < t ? 1 - seg(T, t - 0.05, t) : seg(T, t, t + 0.14)) : 1, op: fade });
      var rk = seg(T, t, t + 0.4);
      rip.style.width = rip.style.height = sz + "px"; rip.style.margin = (-sz / 2) + "px 0 0 " + (-sz / 2) + "px";
      css(rip, { x: tp.u, y: tp.v, s: 1 + rk * 2.2, op: T >= t ? (1 - rk) * 0.8 : 0 });
    }
    vis(ptr, on); vis(rip, on);
  }

  // ───────────── homografia (retângulo → quadrilátero projetado) ─────────────
  function solveH(src, dst) {
    var A = [], b = [], i, r, k, c;
    for (i = 0; i < 4; i++) { var x = src[i][0], y = src[i][1], X = dst[i][0], Y = dst[i][1];
      A.push([x, y, 1, 0, 0, 0, -X * x, -X * y]); b.push(X); A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]); b.push(Y); }
    for (c = 0; c < 8; c++) { var p = c; for (r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      var t = A[c]; A[c] = A[p]; A[p] = t; t = b[c]; b[c] = b[p]; b[p] = t;
      for (r = c + 1; r < 8; r++) { var f = A[r][c] / A[c][c]; for (k = c; k < 8; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; } }
    var hh = new Array(8); for (r = 7; r >= 0; r--) { var s = b[r]; for (k = r + 1; k < 8; k++) s -= A[r][k] * hh[k]; hh[r] = s / A[r][r]; }
    return hh;
  }

  /*
   * CSS da tela a partir da homografia. Quando a tela cobre o quadro inteiro (bordas fora de vista), troca a
   * perspectiva por uma afim equivalente no centro do quadro: o Chrome passa a rasterizar só o trecho visível
   * (2,2 s → ~0,3 s por quadro nos closes). Na faixa de transição mistura as duas, sem salto.
   */
  function coverMargin(dst, W, H) {   // >0: o quadrilátero da tela cobre o quadro inteiro com essa folga (px)
    var area = 0;
    for (var k = 0; k < 4; k++) { var p = dst[k], q = dst[(k + 1) % 4]; area += p[0] * q[1] - q[0] * p[1]; }
    var sgn = area > 0 ? -1 : 1;   // orientação do quadrilátero
    function inside(px, py) {
      var m = 1e9;
      for (var i = 0; i < 4; i++) { var a = dst[i], b = dst[(i + 1) % 4], ex = b[0] - a[0], ey = b[1] - a[1], L = Math.hypot(ex, ey) || 1;
        m = Math.min(m, sgn * ((px - a[0]) * ey - (py - a[1]) * ex) / L); }
      return m;
    }
    return Math.min(inside(0, 0), inside(W, 0), inside(W, H), inside(0, H));
  }
  function screenTransform(hh, W, H, dst) {
    var margin = coverMargin(dst, W, H);
    var lam = 1 - sstep(20, 160, margin);   // 1 = perspectiva completa, 0 = afim
    var H3 = [hh[0], hh[1], hh[2], hh[3], hh[4], hh[5], hh[6], hh[7], 1];
    if (lam < 1) {
      // ponto da tela que cai no centro do quadro (inversa da homografia) e jacobiano ali
      var a = H3, det = a[0] * (a[4] * a[8] - a[5] * a[7]) - a[1] * (a[3] * a[8] - a[5] * a[6]) + a[2] * (a[3] * a[7] - a[4] * a[6]);
      var inv = [(a[4] * a[8] - a[5] * a[7]) / det, (a[2] * a[7] - a[1] * a[8]) / det, (a[1] * a[5] - a[2] * a[4]) / det,
                 (a[5] * a[6] - a[3] * a[8]) / det, (a[0] * a[8] - a[2] * a[6]) / det, (a[2] * a[3] - a[0] * a[5]) / det,
                 (a[3] * a[7] - a[4] * a[6]) / det, (a[1] * a[6] - a[0] * a[7]) / det, (a[0] * a[4] - a[1] * a[3]) / det];
      var X = W / 2, Y = H / 2, wz = inv[6] * X + inv[7] * Y + inv[8], x0 = (inv[0] * X + inv[1] * Y + inv[2]) / wz, y0 = (inv[3] * X + inv[4] * Y + inv[5]) / wz;
      var w = H3[6] * x0 + H3[7] * y0 + 1;
      var A = [(H3[0] - X * H3[6]) / w, (H3[1] - X * H3[7]) / w, 0, (H3[3] - Y * H3[6]) / w, (H3[4] - Y * H3[7]) / w, 0, 0, 0, 1];
      A[2] = X - A[0] * x0 - A[1] * y0; A[5] = Y - A[3] * x0 - A[4] * y0;
      if (lam <= 0) return "matrix(" + [A[0], A[3], A[1], A[4], A[2], A[5]].map(function (v) { return v.toFixed(6); }).join(",") + ")";
      for (var i = 0; i < 9; i++) H3[i] = A[i] + (H3[i] - A[i]) * lam;
      for (i = 0; i < 9; i++) H3[i] /= H3[8] || 1;
    }
    return "matrix3d(" + [H3[0], H3[3], 0, H3[6], H3[1], H3[4], 0, H3[7], 0, 0, 1, 0, H3[2], H3[5], 0, 1].map(function (v) { return v.toFixed(9); }).join(",") + ")";
  }

  // ───────────── palco 3D ─────────────
  /*
   * opts: {
   *   canvas, screenEl (elemento 1170×2532 que recebe matrix3d), W=1920, H=1080, SW=390, SH=844 (pt da tela),
   *   model: "models/iphone.glb", body: 0x1b1d20 (cor do alumínio), glow: [r,g,b] 0..1 (brilho atrás do celular),
   *   floor: true
   * }
   */
  function Stage(o) {
    var W = o.W || 1920, H = o.H || 1080, SW = o.SW || 390, SH = o.SH || 844, self = this;
    this.W = W; this.H = H; this.SW = SW; this.SH = SH;
    var renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(W, H, false); renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1; renderer.outputEncoding = THREE.sRGBEncoding;
    o.canvas.addEventListener("webglcontextlost", function () { root.__lost = true; });
    var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, W / H, 0.02, 200);
    scene.add(camera);
    this.renderer = renderer; this.scene = scene; this.camera = camera;

    // ambiente (reflexos no metal e no vidro)
    var eC = document.createElement("canvas"); eC.width = 1024; eC.height = 512; var ec = eC.getContext("2d");
    var eg = ec.createLinearGradient(0, 0, 1024, 0);
    eg.addColorStop(0, "#020403"); eg.addColorStop(0.2, "#101414"); eg.addColorStop(0.32, "#f0f4f2"); eg.addColorStop(0.4, "#0a0c0c");
    eg.addColorStop(0.62, "#ffffff"); eg.addColorStop(0.7, "#101414"); eg.addColorStop(1, "#020403");
    ec.fillStyle = eg; ec.fillRect(0, 0, 1024, 512);
    var vg = ec.createLinearGradient(0, 0, 0, 512); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(0.55, "rgba(0,0,0,.2)"); vg.addColorStop(1, "rgba(0,0,0,.95)");
    ec.fillStyle = vg; ec.fillRect(0, 0, 1024, 512);
    var eT = new THREE.CanvasTexture(eC); eT.mapping = THREE.EquirectangularReflectionMapping;
    var pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(eT).texture; eT.dispose(); pm.dispose();

    // fundo em shader preso à câmera: brilho atrás do celular + "inundação" de cor animada + faixa de luz
    var g0 = o.glow || [0.07, 0.55, 0.25];
    this.bg = { uTime: { value: 0 }, uGlow: { value: 1 }, uGlowPos: { value: new THREE.Vector2(0.65, 0.5) }, uGlowCol: { value: new THREE.Color(g0[0], g0[1], g0[2]) },
      uFlood: { value: 0 }, uC1: { value: new THREE.Color(0.4, 0.1, 0.6) }, uC2: { value: new THREE.Color(0.8, 0.1, 0.5) }, uSweep: { value: -1 }, uBeat: { value: 0.3 }, uDark: { value: 0 } };
    var bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: this.bg, depthTest: false, depthWrite: false,
      vertexShader: "varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.9999,1.0);}",
      fragmentShader: [
        "uniform float uTime,uGlow,uFlood,uSweep,uBeat,uDark;uniform vec2 uGlowPos;uniform vec3 uC1,uC2,uGlowCol;varying vec2 v;",
        "void main(){vec2 p=v;vec2 q=(p-uGlowPos)*vec2(1.78,1.0);vec3 c=vec3(0.006,0.008,0.007);",
        "float g=exp(-dot(q,q)*3.2);c+=uGlowCol*g*0.42*uGlow;float g2=exp(-dot(q,q)*14.0);c+=uGlowCol*1.6*g2*0.18*uGlow;",
        "float w=0.5+0.5*sin(p.x*4.0+uTime*0.9+sin(p.y*3.0-uTime*0.6)*1.6);float w2=0.5+0.5*sin(p.y*5.0-uTime*0.7+p.x*2.0);",
        "vec3 fl=mix(uC1,uC2,w)*(0.55+0.45*w2);fl*=0.55+0.6*uBeat;float fv=smoothstep(1.25,0.15,length((p-vec2(0.5,0.45))*vec2(1.5,1.2)));",
        "c=mix(c,fl*fv,uFlood*0.85);",
        "float sw=exp(-pow((p.x-uSweep)*5.0,2.0))*smoothstep(0.62,0.28,p.y)*smoothstep(0.0,0.3,p.y);c+=uGlowCol*1.5*sw*0.25;",
        "float vig=smoothstep(1.15,0.35,length((p-0.5)*vec2(1.25,1.0)));c*=mix(0.35,1.0,vig);c*=1.0-uDark;gl_FragColor=vec4(c,1.0);}"
      ].join("\n")
    }));
    bg.frustumCulled = false; bg.renderOrder = -10; scene.add(bg);

    // piso brilhante com borda que some (envMapIntensity baixo: evita manchas de luz no rodapé)
    if (o.floor !== false) {
      var fa = document.createElement("canvas"); fa.width = fa.height = 256; var fx = fa.getContext("2d");
      var fg = fx.createRadialGradient(128, 128, 10, 128, 128, 128); fg.addColorStop(0, "#fff"); fg.addColorStop(0.45, "#888"); fg.addColorStop(1, "#000");
      fx.fillStyle = fg; fx.fillRect(0, 0, 256, 256);
      var floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshStandardMaterial({ color: 0x050706, metalness: 0.45, roughness: 0.6, transparent: true, alphaMap: new THREE.CanvasTexture(fa), envMapIntensity: 0.12 }));
      floor.rotation.x = -PI / 2; floor.position.y = -2.05; scene.add(floor);
    }
    scene.add(new THREE.AmbientLight(0x223328, 0.6));
    var key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 4, 5); scene.add(key);
    this.rim = new THREE.PointLight(new THREE.Color(g0[0] * 1.8, g0[1] * 1.6, g0[2] * 1.6), 5, 14); this.rim.position.set(-2.8, 1.6, -2.2); scene.add(this.rim);
    this.rim2 = new THREE.PointLight(this.rim.color.clone(), 2.5, 12); this.rim2.position.set(3, 1.2, -3); scene.add(this.rim2);
    this.sweep = new THREE.PointLight(0xffffff, 0, 7); scene.add(this.sweep);

    this.phone = new THREE.Group(); scene.add(this.phone);
    this.screenEl = o.screenEl;
    this.cw = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    this.SRC = [[0, 0], [SW * 3, 0], [SW * 3, SH * 3], [0, SH * 3]];
    var bodyCol = o.body === undefined ? 0x1b1d20 : o.body;

    this.ready = new Promise(function (res, rej) {
      new THREE.GLTFLoader().load(o.model || "models/iphone.glb", function (gltf) {
        var m = gltf.scene, box = new THREE.Box3().setFromObject(m), sz = box.getSize(new THREE.Vector3());
        m.scale.setScalar(3.2 / sz.y); box.setFromObject(m); m.position.sub(box.getCenter(new THREE.Vector3()));
        m.traverse(function (ch) {
          if (!ch.isMesh) return;
          var nm = (ch.material && ch.material.name) || "";
          if (ch.name.indexOf("front-glass") === 0) { self.glass = ch; ch.material = new THREE.MeshPhysicalMaterial({ color: 0x010101, metalness: 0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 }); }
          else if (/aluminium|antenna|ceramic-shield-back|lens-ring|apple-logo/.test(nm)) {
            var mt = ch.material.clone(); mt.color.setHex(/antenna/.test(nm) ? 0x0c0d0e : bodyCol); mt.metalness = 0.92; mt.roughness = 0.32; ch.material = mt;
          }
        });
        // a tela do modelo precisa olhar para -Z no espaço do modelo (o grupo gira PI e ela encara a câmera)
        var front = m.getObjectByName("front-glass"), back = m.getObjectByName("rear-window");
        if (front && back) { m.updateWorldMatrix(true, true); var fp = new THREE.Vector3(), bp = new THREE.Vector3(); front.getWorldPosition(fp); back.getWorldPosition(bp); if (fp.z > bp.z) m.rotation.y += PI; }
        self.phone.add(m);
        // retângulo do display (proporção SW:SH) dentro do vidro, no espaço local do vidro
        var g = self.glass.geometry; g.computeBoundingBox(); var bb = g.boundingBox;
        var bw = bb.max.x - bb.min.x, bh = bb.max.y - bb.min.y, ratio = SW / SH, bz = (bb.max.z + bb.min.z) / 2;
        var b = Math.max((bw - ratio * bh) / (2 * (1 - ratio)) || 0, bw * 0.012);
        var dw = bw - 2 * b, dh = dw / ratio, oy = (bh - dh) / 2;
        self.phone.rotation.set(0, PI, 0); self.phone.updateMatrixWorld(true);
        var pL = new THREE.Vector3(bb.min.x, 0, bz).applyMatrix4(self.glass.matrixWorld), pR = new THREE.Vector3(bb.max.x, 0, bz).applyMatrix4(self.glass.matrixWorld);
        var flip = pL.x > pR.x, xl = flip ? bb.max.x - b : bb.min.x + b, xr = flip ? bb.min.x + b : bb.max.x - b, yt = bb.max.y - oy, yb = bb.min.y + oy;
        self.disp = [new THREE.Vector3(xl, yt, bz), new THREE.Vector3(xr, yt, bz), new THREE.Vector3(xr, yb, bz), new THREE.Vector3(xl, yb, bz)];
        res(self);
      }, undefined, rej);
    });
  }
  Stage.prototype.setPhone = function (p) {   // p: { x, y, z, rx, ry, rz }
    p = p || {};
    this.phone.position.set(p.x || 0, p.y || 0, p.z || 0);
    this.phone.rotation.set(p.rx || 0, PI + (p.ry || 0), p.rz || 0);
    this.phone.updateMatrixWorld(true);
    for (var i = 0; i < 4; i++) this.cw[i].copy(this.disp[i]).applyMatrix4(this.glass.matrixWorld);
  };
  Stage.prototype.screenWorld = function (u, v) {
    var a = this.cw[0], b = this.cw[1], d = this.cw[3], su = u / this.SW, sv = v / this.SH;
    return new THREE.Vector3(a.x + (b.x - a.x) * su + (d.x - a.x) * sv, a.y + (b.y - a.y) * su + (d.y - a.y) * sv, a.z + (b.z - a.z) * su + (d.z - a.z) * sv);
  };
  Stage.prototype.project = function (p) { var q = p.clone().project(this.camera); return [(q.x + 1) / 2 * this.W, (1 - q.y) / 2 * this.H, q.z]; };
  Stage.prototype.screenPx = function (u, v) { return this.project(this.screenWorld(u, v)); };
  // alvos de câmera: S(u,v) = ponto da tela em pt; Wp(x,y,z) = ponto do mundo (celular na origem, 3,2 de altura)
  Stage.prototype.resolve = function (k) { if (k.w) return k.w; var p = this.screenWorld(k.s[0], k.s[1]); return [p.x, p.y, p.z]; };
  Stage.prototype.trackP = function (T, keys) {
    if (T <= keys[0][0]) return this.resolve(keys[0][1]);
    for (var i = 1; i < keys.length; i++) if (T <= keys[i][0]) { var a = keys[i - 1], b = keys[i]; return mix(this.resolve(a[1]), this.resolve(b[1]), (b[2] || E.cubicInOut)((T - a[0]) / (b[0] - a[0]))); }
    return this.resolve(keys[keys.length - 1][1]);
  };
  /*
   * Renderiza um quadro. cam: { target:[x,y,z], dist, yaw, pitch, fx (deslocamento horizontal do quadro, fração da largura),
   *   shake (0..1), handheld (padrão 1) }. Retorna true se a tela estiver visível (todas as quinas na frente da câmera).
   */
  Stage.prototype.render = function (T, cam) {
    var d = cam.dist, yaw = cam.yaw || 0, pit = cam.pitch || 0, tg = cam.target, camera = this.camera;
    var cp = new THREE.Vector3(tg[0] + d * Math.sin(yaw) * Math.cos(pit), tg[1] + d * Math.sin(pit), tg[2] + d * Math.cos(yaw) * Math.cos(pit));
    var hs = d * 0.0016 * (cam.handheld === undefined ? 1 : cam.handheld), sh = cam.shake || 0;
    cp.x += Math.sin(T * 1.7) * hs + Math.sin(T * 3.1) * hs * 0.5 + Math.sin(T * 61) * 0.09 * sh;
    cp.y += Math.sin(T * 1.3 + 1) * hs + Math.sin(T * 2.7) * hs * 0.4 + Math.sin(T * 47 + 2) * 0.07 * sh;
    camera.position.copy(cp); camera.up.set(Math.sin(T * 0.9) * 0.004 + Math.sin(T * 53) * 0.02 * sh, 1, 0);
    camera.lookAt(tg[0], tg[1], tg[2]);
    var fx = cam.fx || 0;
    if (Math.abs(fx) > 1e-4) camera.setViewOffset(this.W, this.H, -fx * this.W, 0, this.W, this.H); else camera.clearViewOffset();
    camera.updateMatrixWorld(true);
    this.bg.uTime.value = T;
    var pp = this.project(new THREE.Vector3(0, 0, 0)); this.bg.uGlowPos.value.set(pp[0] / this.W, 1 - pp[1] / this.H);
    var dst = [], ok = true;
    for (var i = 0; i < 4; i++) { var q = this.cw[i].clone().project(camera); if (q.z > 1 || q.z < -1) ok = false; dst.push([(q.x + 1) / 2 * this.W, (1 - q.y) / 2 * this.H]); }
    // tela cobrindo o quadro inteiro: o 3D não aparece, então não renderiza (o WebGL por software custa ~2 s/quadro nos closes)
    this.covered = ok && coverMargin(dst, this.W, this.H) > 2;
    if (!this.covered) this.renderer.render(this.scene, camera);
    this.renderer.domElement.style.visibility = this.covered ? "hidden" : "";
    if (ok) this.screenEl.style.transform = screenTransform(solveH(this.SRC, dst), this.W, this.H, dst);
    return ok;
  };

  root.ENG = { mix: mix, track: track, css: css, vis: vis, h: h, words: words, beatPulse: beatPulse, tapPulse: tapPulse,
    keyTimes: keyTimes, typed: typed, typedF: typedF, SFX: SFX, buildKeyboard: buildKeyboard, pointer: pointer, solveH: solveH, screenTransform: screenTransform, coverMargin: coverMargin, Stage: Stage,
    S: function (u, v) { return { s: [u, v] }; }, Wp: function (x, y, z) { return { w: [x, y, z] }; } };
})(window);
