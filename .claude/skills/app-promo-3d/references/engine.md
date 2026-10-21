# Motor: API e receitas

Carregue nesta ordem: `lib/gsap.min.js`, `lib/three.min.js`, `lib/GLTFLoader.js`, `lib/motion-lite.js` e `lib/engine.js`. Isso expõe `window.OM` (curvas) e `window.ENG` (motor).

## Estrutura do HTML

```
#root[data-composition-id=main][data-duration]   (contrato HyperFrames, para preview/check)
  #stage
    canvas#gl                       WebGL 1920×1080 (celular, fundo em shader, piso)
    #scr (1170×2532, recebe matrix3d/matrix)
      #ui (390×844 pt, zoom:3, border-radius 55)
        .pg  … uma por página do app (home, busca, player…)
        .status  .island  #kbd  #rip  #ptr  #glare
    sobreposições 2D (títulos, letras, cards de vidro, cartela final)
```

A tela é **DOM comum** em pontos de iPhone (390×844). Um print de 1170 px de largura ÷ 3 dá as medidas em pt. Ela é renderizada a 3× e mapeada sobre o vidro do modelo, por isso o texto fica nítido em qualquer close.

## Palco

```js
var stage = new ENG.Stage({ canvas, screenEl: $("scr"), glow: [r,g,b] /*0..1*/, body: 0x1b1d20 });
stage.ready.then(...)                          // GLB carregado + retângulo do display calculado
stage.setPhone({ y, ry, rx, rz, x, z })        // celular (ry=0 → de frente para +Z)
stage.render(T, { target:[x,y,z], dist, yaw, pitch, fx, shake })   // → true se a tela está visível
stage.screenWorld(u, v) / stage.screenPx(u, v) // ponto da tela (pt) → mundo / pixel do quadro
stage.trackP(T, CAM_T)                         // interpola alvos S(u,v) / Wp(x,y,z)
stage.bg.uFlood/uC1/uC2/uBeat/uSweep/uDark/uGlow/uGlowCol   // fundo em shader
stage.rim, stage.rim2, stage.sweep             // luzes (cor/intensidade por tempo)
stage.covered                                  // true quando a tela cobre o quadro (WebGL pulado)
```

### Escala do mundo
- O celular tem 3,2 unidades de altura, centrado na origem, com a tela ≈ 1,43 × 3,1.
- Com FOV de 34°, a altura visível do quadro é ≈ 0,611 × distância. O celular inteiro aparece em dist ≈ 6–7.
- Close numa linha de texto: dist 0,7–0,9, que mostra ~200 pt de largura.
- Close numa fileira de ícones: dist 1,1–1,3.

### Trilhas
Cada trilha é `[[t, valor, easeDoTrechoQueChegaAqui], …]`. Use `ENG.track(T, keys)` para números e `stage.trackP` para alvos.
- **`CAM_D`:** guarde `Math.log(dist)`. A interpolação em log dá zoom de velocidade constante.
- **`CAM_FX`:** desloca o quadro; 0,2 põe o celular a ~67% da largura. Use em planos abertos com texto ao lado e volte a 0 nos closes.
- **Easings:** `E.cubicInOut` (padrão), `E.sineInOut` (derivas lentas), `E.expoIn` (mergulho que acelera para um corte), `E.expoInOut` (chicote).
- **Câmera na mão:** aplicada automaticamente (≈0,16% da distância). `shake` é a tremida do impacto; use `Math.exp(-(T - drop) * 7)`.
- **Pulso na batida:** `d *= 1 - 0.03 * ENG.beatPulse(T, DROP, BEAT)`.

## UI

```js
ENG.css(el, { x, y, s, sx, sy, r, op, blur })   // blur só em sobreposições 2D!
ENG.vis(el, bool)
ENG.words(el, ["Ouça", " o que", …]) → spans  // para entrar palavra por palavra
OM.wordRise(T, t0, {dist}) → {y, s, op}        OM.popIn(T, t0) → {dy, s, op}     OM.liftOut(T, t1) → {dy, op, blur}
OM.spring(T - t0, zeta, omega)                 // 0→1 com overshoot (zeta 0,6 / omega 18–22 = UI do iOS)
ENG.tapPulse(T, t)                             // encolhe/volta de um botão tocado
ENG.beatPulse(T, t0, BEAT)                     // 1 na batida, decai até a próxima
```

### Ponteiro de toque
Toques em pt da tela, pintados por `ENG.pointer(T, $("ptr"), $("rip"), TAPS)`:
```js
var TAPS = [{ t: 5.2, u: 195, v: 393, size: 22, tin: 4.96, tout: 5.34, from: [300, 640] }];
```
O ponteiro entra em curva vindo de `from`, encolhe para 0,84 no toque e deixa uma ondulação.
- Tamanho: 22–26 pt em closes, 30 pt em planos abertos.

### Digitação
```js
var Q = "músicas pra dirigir à noite", K = ENG.keyTimes(Q, 6.92, 8.55, 7);   // tempos humanizados e determinísticos
$("tx").textContent = Q.slice(0, ENG.typed(T, K));
var kb = ENG.buildKeyboard($("kbd"), goHtml); kb.press(T, K, Q);   // tecla acesa + balão
ENG.SFX.keys(K, 0.3);                                              // som de cada tecla
```
- **Câmera seguindo o cursor:** meça as larguras dos prefixos com `canvas.measureText` (fonte já carregada). O alvo é `S(x0 + largura(ENG.typedF(T, K)), yDoCampo)`, com `typedF` contínuo para não dar trancos.
- **Teclado:** suba entre 0,25 e 0,3 s antes da 1ª tecla e desça depois da última.

### Abrir app (animação real do iOS)
- O `#win` cresce do retângulo do ícone até a tela inteira (`E.expoOut`, 0,6 s) com o raio de 15 → 55.
- O logo fica no centro e os outros ícones recuam (escala 0,88 e opacidade 0).
- Ao mesmo tempo, a câmera recua do close para o celular inteiro: é o "carry" que dispensa corte.

### Transições sem corte (one take)
- **Close de mergulho:** a câmera entra até a tela cobrir o quadro. Nesse instante qualquer troca de conteúdo do mesmo fundo é invisível, por exemplo da home do iOS para uma fileira de ícones.
- **Atravessar uma capa:** dist → 0,16 com `E.expoIn`. Uma sobreposição 2D em tela cheia entra com opacidade nos últimos 0,15 s.
- **Contração para um ponto:** máscara radial que se fecha sobre `stage.screenPx(u, v)`, ponto de luz, 2 quadros pretos e o drop.

## SFX
```js
ENG.SFX.add(nome, t, ganho, { rate, dur, pan }).add(…);  ENG.SFX.publish();   // → window.__sfx
```
Arquivos disponíveis (`assets/sfx`):

| Arquivo | Uso |
|---|---|
| whoosh, whoosh-short, whoosh-cinematic | movimentos de câmera, transições |
| click, click-soft | toques |
| key-press, typing | digitação |
| pop | itens entrando |
| sparkle, chime | IA, logo |
| riser | antecipação do drop |
| impact-bass-1, impact-bass-2 | drop |
| glitch-1..3, notification, ping, error | uso pontual |

- **Ganhos de referência:** toque 0,7; tecla 0,25–0,3; whoosh 0,5; impacto do drop 0,9.
- **Música:** fica em 0,9. A mixagem aplica limitador e normalização.

## Desempenho
Medido com SwiftShader, sem GPU, depois das otimizações do motor.
- **Close de tela:** 0,1–0,2 s por quadro (o WebGL é pulado).
- **Close médio, com o celular enchendo o quadro:** ~0,9 s.
- **Plano aberto:** ~0,4 s.
- **Vidro com `backdrop-filter` grande sobre o 3D:** ~2 s. Use pouco.
- **Processos:** 2 por padrão; mais não acelera.
