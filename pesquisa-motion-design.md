# Pesquisa: como criar motion design profissional com agentes de IA

Levantamento de 21/10/2026, com 5 frentes em paralelo (web + GitHub) e as medições feitas aqui no comercial do Spotify e na skill `app-promo-3d`.

- **Estrelas e preços:** são aproximados; as fontes divergem.
- **Licenças:** foram lidas nos repositórios. Confirme antes de uso comercial.

---

## 1. Frameworks de vídeo por código

| Framework | ★ | Licença | Atividade | Para quê |
|---|---|---|---|---|
| **HyperFrames** (HeyGen) | ~69k | Apache-2.0 | release diário (0.8.184) | HTML+GSAP/Three/Lottie → MP4. 21 skills, ~400 blocos, motion blur por subquadros, transições shader, HDR, mix de áudio, render Lambda/Cloud Run |
| **Remotion** | ~66k | **paga acima de 3 funcionários** (US$ 25/seat/mês ou US$ 0,01/render) | 4.0.537 (out/26) | React. Ecossistema mais maduro, `@remotion/three`, motion blur, skills oficiais |
| Motion Canvas | ~19k | MIT | lento (release dez/24) | tipografia/código animado com editor e waveform |
| Revideo | ~4k | MIT | 0.11 (jul/26) | fork headless do Motion Canvas, render paralelo |
| Theatre.js | ~13k | core Apache / **studio AGPL** | parado (v1 privada) | graph editor visual, câmera 3D |
| Manim (CE) | ~42k | MIT | 0.22 (out/26) | matemática, LaTeX, morph de formas |
| Lottie / dotLottie | ~32k | MIT | dotLottie ativo | vetor leve para apps; MCP oficial LottieFiles |
| Rive | — | runtime MIT, editor pago | ativo | animação interativa (state machines); MCP só no app desktop |
| Blender (bpy) | — | GPL (o vídeo é livre) | 5.2.2 | único com 3D fotorreal (Cycles); precisa de GPU para ser viável |
| fframes | ~2,9k | MIT | ativo | Rust + Skia na GPU, shaders por camada, skill para agentes |
| editly / FFCreator / MoviePy | 3–15k | MIT | parados/lentos | montagem por JSON/Python, sem navegador |
| Etro / Twick / Diffusion Studio | ~1k | GPL / restritiva / MPL | ativos | render no navegador via WebCodecs |

**Veredito: HyperFrames continua sendo a base.**
- É livre, tem o maior conjunto de skills para agentes e já está instalado.
- **Remotion** só se o projeto for pessoal ou de equipe pequena.
- **Blender** entra como passe de render 3D fotorreal, composto depois no HyperFrames, quando houver GPU.
- **Ressalva:** o motion blur nativo do HyperFrames não funciona junto com transições shader nem com HDR. A nossa captura própria não tem essa limitação.

---

## 2. Skills e MCPs (o que dá para usar aqui)

### Funcionam no contêiner (Linux, sem GPU)

| Item | ★ | Licença | Por que vale |
|---|---|---|---|
| HyperFrames skills | — | Apache-2.0 | já instalado |
| **video-shotcraft** — github.com/Vincentwei1021/video-shotcraft | ~12,8k | Apache-2.0 (usa Remotion) | promo de produto a partir de screenshots, ~150 "receitas de plano", QA por quadros |
| **GSAP skills oficial** — github.com/greensock/gsap-skills | ~16,8k | MIT | evita os erros comuns de API do motor que usamos |
| **brag** — github.com/latent-spaces/brag | ~17k | MIT | projeto → vídeo de lançamento sobre HyperFrames |
| **LottieFiles motion-design-skill** | ~2,4k | MIT | teoria de timing/easing/coreografia |
| **diffusionstudio/lottie** | ~4k | MIT | texto → animação Lottie |
| **iart-ai/motion-skills** | ~935 | MIT | 55 skills: kinetic type, lower-thirds, WebGL, verificação por quadros |
| **ffmpeg-skill** (MCP) — github.com/kajisho5/ffmpeg-skill | ~2k | MIT | 42 ferramentas de pós (loudnorm, legendas, reframe, contact sheet) |
| onetake | ~2,8k | **não comercial** | câmera contínua + medidor de continuidade (já usamos a ideia) |
| OpenMontage | ~70k | **AGPL** | orquestra vários pipelines (já instalado) |
| video-use | ~29k | MIT | edição de filmagem real por transcrição (exige chave ElevenLabs) |
| ElevenLabs (MCP hospedado + skills) | — | — | voz, SFX, música (o MCP local foi arquivado em ago/26) |
| Higgsfield MCP | — | — | já conectado: vídeo/imagem por IA, upscale, recorte, relight |
| Runway MCP | — | — | Gen-4.5, Aleph (vídeo → vídeo) |

### Não funcionam aqui
Exigem o programa aberto em Windows/macOS: MCPs de **After Effects, Premiere, DaVinci Resolve, Cinema 4D, Rive, Spline e CapCut**. O **blender-mcp** padrão também não, porque precisa da interface aberta. Existe um fork headless (sandraschi/blender-mcp), mas é lento sem GPU.

**Mapa do nicho:** github.com/zhuyansen/awesome-claude-video-skills (180–300 repos, com nota de segurança).

**Lacunas do mercado:**
- nenhuma ferramenta profissional roda headless em Linux;
- não há benchmark objetivo de qualidade de motion;
- quase não há exportação para projeto editável de After Effects/Premiere;
- o ecossistema é muito jovem (repos de dias, licenças não declaradas).

---

## 3. Técnicas de nível estúdio (valores prontos para usar)

### Curvas e molas
- **Material 3** (código do AndroidX):
  - Emphasized `cubic-bezier(0.2,0,0,1)`;
  - EmphasizedDecelerate `(0.05,0.7,0.1,1)`;
  - EmphasizedAccelerate `(0.3,0,0.8,0.15)`.
- **Durações Material 3:** 50–200 ms (curtas), 250–400 (médias), 450–600 (longas), 700–1000 ms.
- **Molas do Material Expressive** (amortecimento/rigidez):
  - posição 0,8/380, rápida 0,6/800, lenta 0,8/200;
  - opacidade/cor 1,0/1600.
- **Apple iOS 17+:** `smooth`/`snappy`/`bouncy` com duração 0,5 s e bounce 0 / 0,15 / 0,3. Conversão: k = (2π/resposta)², c = 4π·ζ/resposta.
- **Framer Motion:** 100/10/1. react-spring gentle 120/14, wobbly 180/12.
- **Curvas de estúdio:**
  - títulos: expoOut `(0.16,1,0.3,1)`;
  - câmera: easeInOutCubic `(0.65,0,0.35,1)`.
- **Regras:**
  - saídas com 60–75% da duração da entrada;
  - overlap de 2–4 quadros entre pai e filho;
  - antecipação de 5–10% por 80–150 ms;
  - texto de leitura sem overshoot.

### Motion blur
- **Padrão do After Effects:** obturador de 180°, **16 amostras por quadro** (64 em whip pan), centralizado no quadro (fase −90°), média em luz linear.
- **Nossa skill:** usa 4 amostras. O próximo passo é deixar adaptativo, com 4 em cenas calmas e 16 em chicotes e mergulhos.

### Câmera
- **Lentes:** 35–50 mm para planos de destaque, 85–135 mm para produto.
- **Whip pan:** 6–10 quadros.
- **Rack focus:** 12–24 quadros.
- **Tremor procedural** (GDC 2016, "Juicing Your Cameras"): tremor = trauma² × ruído fractal. Câmera na mão a 0,5–2 Hz e 0,2–0,5°; impacto a 8–15 Hz, decaindo em ~1 s.
- **Bibliotecas:** simplex-noise (MIT), camera-controls (MIT).

### Profundidade de campo
- pmndrs/postprocessing `DepthOfFieldEffect` (Zlib) ou `BokehPass` do Three.
- Abertura f/1.4–2.8 no plano de destaque, com leve "respiração" de FOV.

### Tipografia
- **GSAP SplitText:** agora grátis, inclusive para uso comercial.
- **Revelar por máscara:** `yPercent 110→0`, 0,8–1 s expoOut, 60–100 ms entre linhas, 20–40 ms entre letras.
- **Fontes variáveis animadas** (`wght`/`wdth`, OFL): Roboto Flex, Inter, Recursive.

### Transições
- **gl-transitions** (MIT, licença por shader): directional-warp, crosswarp, CrossZoom, displacement, morph.
- **Zoom-through:** 20–40× com blur radial.
- **Corte:** match cut alinhando forma e posição.

### Liquid glass de verdade
1. SDF de retângulo arredondado (Inigo Quilez).
2. Normal tirada do perfil de altura.
3. Refração de Snell com n≈1,5.
4. Dispersão RGB.
5. Fresnel na borda.

- **Referências:** liquid-glass-studio, liquid-glass-react (MIT).
- **Em CSS:** só Chromium, com `feDisplacementMap`.

### Acabamento (pós-produção em HDR linear, nesta ordem)
1. Profundidade de campo.
2. Motion blur.
3. Bloom: threshold 0,8–1, intensidade 0,5–1,5.
4. Aberração cromática: 0,5–2 px nas bordas.
5. Tone mapping: AgX ou ACES; Khronos Neutral para produto.
6. LUT `.cube`.
7. Vinheta: 0,2–0,35.
8. Grão: 2–5%, novo a cada quadro.
9. Dither e conversão para sRGB.

**Atenção à licença:** shaders lygia têm licença comercial paga. Prefira webgl-noise (MIT).

### Ritmo e som
- **Cortes:** na batida, ou 1–2 quadros antes.
- **Montagem rápida:** 0,4–0,8 s por plano.
- **Leitura:** no máximo 20 caracteres/s.
- **Whoosh:** pico no corte, começando 6–15 quadros antes.
- **Impacto:** 3 camadas (sub, clique médio, brilho agudo).
- **Riser:** 2–4 s até o drop.
- **Mix:** música −8 a −12 dB sob a voz, **−14 LUFS integrado, pico −1 dBTP**.
- **Detecção de batida:** librosa (ISC). madmom tem modelos CC-BY-NC.

### Checklist "nível estúdio" (20 itens)
1. Tempo determinístico e RNG com semente.
2. Nada linear (exceto loops).
3. Molas explícitas, sem overshoot em texto.
4. Antecipação e follow-through.
5. Trajetórias em arco.
6. Saídas mais rápidas que entradas.
7. Um foco por vez.
8. Motion blur com 16 ou mais amostras a 180°.
9. Câmera nunca estática no plano de destaque.
10. Tremor só em impacto.
11. Profundidade de campo plausível.
12. Tempo de leitura e área segura respeitados.
13. Escalonamento consistente.
14. Transições motivadas.
15. Pipeline HDR com AgX/ACES.
16. Bloom contido e LUT.
17. Grão e dither.
18. Cortes no grid da batida (±1 quadro).
19. Áudio a −14 LUFS e −1 dBTP.
20. Licenças conferidas e revisão quadro a quadro.

---

## 4. IA generativa + código (fluxo híbrido)

### Modelos de vídeo (out/2026)

| Modelo | Destaque | Duração / qualidade | Preço |
|---|---|---|---|
| Gemini Omni Flash | lidera os rankings cegos | até 40 s, 4K, com áudio, edita vídeo | ~US$ 0,10/s |
| Kling 3.0 / O3 | consistência de personagem/produto ("Elements") | até 15 s, 4K | ~US$ 0,08–0,13/s |
| Seedance 2.0/2.5 | o mais usado para animar foto de produto | até 30 s, até 30 imagens de referência | ~US$ 0,15–0,23/s |
| MiniMax H3 | 2K mais barato | até 15 s | US$ 0,08–0,13/s |
| Veo 3.1 Lite | rascunhos | — | US$ 0,05/s |
| Runway Aleph 2 | vídeo → vídeo (trocar estilo, luz, cenário) | — | ~US$ 0,28/s |

- **Fora do mercado:** **Sora 2** (API desligada em 24/09/2026) e **Fly GPUs**.
- **Abertos (precisam de GPU):** Wan 2.2 VACE e LTX-2.x com IC-LoRA (controle por profundidade e pose).

### Imagem
- GPT Image 2 (texto pequeno);
- Nano Banana Pro (edição e coerência de produto);
- Seedream 5;
- FLUX.2;
- Qwen-Image Layered (gera camadas separadas, ótimo para animar por código).

### Pós via API (centavos)
- **Upscale de vídeo:** SeedVR2. Não use upscale quadro a quadro, que cintila.
- **Interpolação de quadros:** RIFE/FILM.
- **Recorte:** SAM 3 + MatAnyone.
- **Relight:** SwitchLight 3.
- **Lip-sync:** sync.so.

### Música, voz e SFX
- **Música licenciada:** ElevenLabs Music v2 ou Stable Audio 2.5. No Suno, o plano grátis não permite uso comercial.
- **Voz:** Kokoro (local, CPU) para rascunho; ElevenLabs no final.
- **SFX:** ElevenLabs.

### Fluxos que funcionam
1. **Produto:** foto real → keyframe por IA → animação imagem→vídeo (Seedance/Kling) → **logo, preço e interface por código por cima**. A IA faz luz e física; o código faz o que precisa ser exato.
2. **B-roll e marca:** B-roll por IA (clima, textura). Abertura, mockup do app e fechamento 100% em código.
3. **Estilização:** animação crua em código, estilizada por Aleph, Omni Flash ou LTX IC-LoRA. Câmera e timing ficam exatos; depois o texto original é recomposto.
4. **Recomposição:** recorta o produto, reilumina e compõe sobre um fundo gerado.

### Regras
- **Nunca gerar o logo pela IA.**
- Áudio desligado na geração; a mixagem é separada.
- Rascunhos em 720p; upscale só dos planos aprovados.
- Orçar ~3 tentativas por segundo aproveitado: um comercial de 30 s custa **US$ 5–36** em geração.

---

## 5. Infraestrutura de render

**Medido aqui:** contêiner de 4 núcleos, sem GPU, Chrome com SwiftShader.

| Situação | Tempo por quadro |
|---|---|
| Antes das otimizações | 2,4 s |
| Depois (skill app-promo-3d) — close de tela | 0,1–0,2 s |
| Depois — plano aberto | ~0,4 s |
| Depois — close médio do celular | ~0,9 s |

- **Em média:** 2 quadros/s. 30 s com motion blur ≈ 40 min.
- **Paralelismo:** mais processos não ajudam, porque o SwiftShader já usa todos os núcleos.

| Nível | Opção | Custo por vídeo de 30 s | Observação |
|---|---|---|---|
| **Grátis** | continuar aqui + otimizações pendentes | 0 | reduzir a resolução interna do WebGL para 0,67 nos planos médios; renderizar o 3D em camada separada a 30 qps e compor no ffmpeg; cache de trechos estáticos; codificar no navegador (WebCodecs) em vez de screenshot; testar lavapipe vs SwiftShader |
| **Barato** | RunPod / Vast (RTX 4090 a ~US$ 0,15–0,53/h) ou AWS g4dn spot, com imagem Docker Chrome+ffmpeg+`libnvidia-gl` | **US$ 0,03–0,15** | 0,1–0,25 s por quadro na GPU. Exige conta e chave. Na AWS, a cota de GPU costuma pedir aprovação manual |
| **Barato, sem GPU** | `hyperframes cloudrun` (o gcloud já está configurado aqui) | US$ 0,30–1 | 1–3 min de relógio, mas ainda por CPU |
| **Máximo** | vários workers GPU (Modal / RunPod Serverless / Cloud Run L4), cada um com um trecho, NVENC, concat | < US$ 0,50 | minutos; Blender Cycles + OptiX para fotorrealismo (US$ 1–5 por vídeo) |

**Armadilha de GPU:** o `nvidia-smi` funciona e mesmo assim o Chrome continua em SwiftShader. É preciso `NVIDIA_DRIVER_CAPABILITIES=compute,utility,graphics` e as libs Vulkan/EGL da NVIDIA na imagem.

---

## 6. Recomendação: o que fazer agora

### A. Instalar (no projeto, headless, sem custo)
1. `gsap-skills`: correção de API do GSAP.
2. `video-shotcraft`: receitas de plano. Usa Remotion, então observar a licença.
3. `LottieFiles/motion-design-skill`: teoria de timing.
4. `ffmpeg-skill`: pós e loudness.
5. Packs selecionados de `iart-ai/motion-skills`: kinetic type, WebGL.

### B. Evoluir a skill `app-promo-3d` com o que a pesquisa trouxe
1. **Motion blur adaptativo:** 4 amostras em cenas calmas, 16 em chicotes e mergulhos.
2. **Cadeia de acabamento** (pmndrs/postprocessing): bloom, grão, LUT, aberração cromática e tone mapping AgX.
3. **Transições** gl-transitions.
4. **Presets de mola** Apple/Material.
5. **Tremor por trauma² com ruído simplex.**
6. **Liquid glass com shader SDF de verdade**, no lugar do CSS.
7. **Loudness −14 LUFS** no `mix.py`.
8. **3D em camada separada a 30 qps** + resolução interna 0,67 nos planos médios, que pode dar até 2–3x de velocidade.

### C. Fluxo híbrido com o que já temos
Higgsfield (Seedance/Kling) para planos de produto e B-roll em 720p sem áudio → código para marca, interface e texto → upscale (Higgsfield `upscale_video`) só dos aprovados.

### D. Quando precisar de velocidade
Uma conta RunPod ou Vast com GPU: ~US$ 0,05 por vídeo e ~10x mais rápido. Exige a conta e a chave guardadas como segredo do ambiente, nunca no código.

---

## Fontes principais

**Frameworks**
- github.com/heygen-com/hyperframes
- github.com/remotion-dev/remotion (LICENSE.md)
- github.com/motion-canvas/motion-canvas
- github.com/midrender/revideo
- github.com/theatre-js/theatre
- github.com/ManimCommunity/manim
- github.com/LottieFiles/dotlottie-web
- rive.app/docs/editor/ai/mcp
- github.com/dmtrKovalenko/fframes

**Skills e MCPs**
- github.com/remotion-dev/skills
- github.com/greensock/gsap-skills
- github.com/Vincentwei1021/video-shotcraft
- github.com/latent-spaces/brag
- github.com/kajisho5/ffmpeg-skill
- github.com/iart-ai/motion-skills
- github.com/diffusionstudio/lottie
- github.com/zhuyansen/awesome-claude-video-skills
- github.com/ahujasid/blender-mcp
- github.com/elevenlabs/skills

**Técnicas**
- AndroidX MotionTokens.kt
- developer.apple.com/videos/play/wwdc2023/10158
- motion.dev/docs/spring
- github.com/pmndrs/postprocessing
- github.com/0beqz/realism-effects
- gl-transitions.com
- iquilezles.org/articles/distfunctions2d
- gsap.com/standard-license
- librosa.org

**IA generativa**
- teamday.ai/blog/best-ai-video-models-2026
- docs.dev.runwayml.com/guides/pricing
- kling.ai/blog/kling-v3-vs-o3-comparison-guide
- fal.ai/models/fal-ai/seedvr/upscale/video
- elevenlabs.io/eleven-music-model-specific-terms

**Infraestrutura**
- remotion.dev/docs/gl-options
- remotion.dev/docs/miscellaneous/cloud-gpu
- docs.runpod.io/serverless/pricing
- docs.cloud.google.com/run/docs/configuring/services/gpu
- mediabunny.dev
