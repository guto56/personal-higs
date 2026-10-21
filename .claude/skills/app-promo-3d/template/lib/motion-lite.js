/*
 * motion-lite.js — curvas e utilitários de animação puros (função do tempo, sem estado).
 * Mesma API usada pelo template: window.OM = { clamp, lerp, seg, sstep, ease, spring, rng, wordRise, popIn, liftOut }.
 */
(function (root) {
  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, k) { return a + (b - a) * k; };
  var seg = function (t, t0, t1) { return t1 === t0 ? (t >= t1 ? 1 : 0) : clamp((t - t0) / (t1 - t0)); };
  var sstep = function (e0, e1, x) { var k = clamp((x - e0) / (e1 - e0)); return k * k * (3 - 2 * k); };
  var ssstep = function (e0, e1, x) { var k = clamp((x - e0) / (e1 - e0)); return k * k * k * (k * (k * 6 - 15) + 10); };
  var powOut = function (n) { return function (u) { return 1 - Math.pow(1 - u, n); }; };
  var powIn = function (n) { return function (u) { return Math.pow(u, n); }; };
  var powInOut = function (n) { return function (u) { return u < 0.5 ? Math.pow(2, n - 1) * Math.pow(u, n) : 1 - Math.pow(-2 * u + 2, n) / 2; }; };
  var EX = 1 - Math.pow(2, -10);
  var ease = {
    linear: function (u) { return u; },
    smooth: function (u) { return u * u * (3 - 2 * u); },
    sineInOut: function (u) { return -(Math.cos(Math.PI * u) - 1) / 2; },
    cubicIn: powIn(3), cubicOut: powOut(3), cubicInOut: powInOut(3),
    quadOut: powOut(2), quartOut: powOut(4), quintOut: powOut(5), quintInOut: powInOut(5),
    expoOut: function (u) { return u <= 0 ? 0 : u >= 1 ? 1 : (1 - Math.pow(2, -10 * u)) / EX; },
    expoIn: function (u) { return u <= 0 ? 0 : u >= 1 ? 1 : (Math.pow(2, 10 * u) - 1) / 1023; },
    expoInOut: function (u) { return u < 0.5 ? ease.expoIn(2 * u) / 2 : 1 - ease.expoIn(2 - 2 * u) / 2; },
    backOut: function (u) { var s = 1.70158; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); }
  };
  // mola amortecida (resposta ao degrau): 0 → 1, com overshoot quando zeta < 1
  function spring(tau, zeta, omega) {
    zeta = zeta === undefined ? 0.6 : zeta; omega = omega === undefined ? 20 : omega;
    if (tau <= 0) return 0;
    if (zeta < 1) { var wd = omega * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * omega * tau) * (Math.cos(wd * tau) + (zeta * omega / wd) * Math.sin(wd * tau)); }
    return 1 - Math.exp(-omega * tau) * (1 + omega * tau);
  }
  // gerador pseudoaleatório determinístico (xorshift32) — o mesmo algoritmo está em scripts/mix.py
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  }
  function opt(o, k, d) { return o && o[k] !== undefined ? o[k] : d; }
  // palavra pousando: sobe com mola e cresce um pouco
  function wordRise(t, t0, o) {
    var k = spring(t - t0, opt(o, "zeta", 0.6), opt(o, "omega", 22));
    return { k: k, op: clamp(k * opt(o, "fade", 1.5)), y: (1 - k) * opt(o, "dist", 26), s: opt(o, "s0", 0.94) + opt(o, "ds", 0.06) * k };
  }
  // card entrando
  function popIn(t, t0, o) {
    var k = spring(t - t0, opt(o, "zeta", 0.62), opt(o, "omega", 18));
    return { k: k, op: clamp(k * opt(o, "fade", 1.5)), s: opt(o, "s0", 0.94) + opt(o, "ds", 0.06) * k, dy: (1 - k) * opt(o, "rise", 36) };
  }
  // saída: sobe, desfoca e some em `dur`
  function liftOut(t, t1, o) {
    var k = ssstep(t1, t1 + opt(o, "dur", 0.22), t);
    return { k: k, op: 1 - k, dy: opt(o, "dir", -1) * k * opt(o, "dist", 90), blur: k * opt(o, "blur", 10), s: 1 + opt(o, "grow", 0.03) * k };
  }
  root.OM = { clamp: clamp, lerp: lerp, seg: seg, sstep: sstep, ssstep: ssstep, ease: ease, spring: spring, rng: rng, wordRise: wordRise, popIn: popIn, liftOut: liftOut };
})(typeof window !== "undefined" ? window : globalThis);
