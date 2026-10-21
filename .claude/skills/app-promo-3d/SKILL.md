---
name: app-promo-3d
description: Cria comerciais e vídeos promocionais de app com acabamento de estúdio. Usa um iPhone 3D real (Three.js) cuja tela é HTML nítido mapeado sobre o vidro, câmera contínua estilo "one take", ponteiro de toque, teclado iOS 26, liquid glass, cortes na batida da música, SFX sincronizados e motion blur real. Use quando pedirem comercial, propaganda, promo, teaser, demo ou "tour pelo app" de um aplicativo (marca real ou fictícia), vídeo de lançamento de app, ou "um vídeo tipo Apple/Spotify mostrando o app no iPhone". Saída: MP4 1080p 30 qps com motion blur + 60 qps + folha de quadros.
---

# app-promo-3d

Pipeline testado num comercial de 30 s do Spotify (`examples/spotify/`). Tudo é **uma função pura do tempo**, `render(T)`, e a captura é feita fora do HyperFrames.

- **`render(T)`:** desenha o iPhone 3D, mapeia a tela HTML sobre o vidro (homografia) e anima a câmera, a UI e as sobreposições.
- **Captura:** `capture.py` tira os quadros em paralelo, retoma de onde parou e aguenta travamentos.
- **Montagem:** `mix.py` mixa a música com os SFX que a própria composição declara, e `assemble.py` gera os MP4.

Rode os scripts com `bash <skill>/scripts/run.sh <script>.py …`. Ele cria sozinho o venv com playwright, numpy e pillow. `<skill>` é a pasta desta skill (`.claude/skills/app-promo-3d`).

## Fluxo (siga na ordem)

### 1. Briefing
Feche tudo antes de construir. Use `references/brief.md`: perguntas, pontos de decisão e o que pedir ao usuário, como prints do app e a música.
- Faça perguntas só se faltar algo que o usuário não deu.
- Se o prompt já responde, não pergunte.

### 2. Assets
- **Logo oficial:** baixe da página de marca da empresa. Logo de uma cor só, sem recolorir nem distorcer; verifique o SVG.
- **Capas e fotos fictícias:** gere com o gerador de imagens disponível.
- **Prints do app:** use como referência de layout, cores e medidas em pt (print de 1170 px de largura ÷ 3).
- **Ícones de apps:** os disponíveis estão em `template/assets/icons/`; a lista está em `references/brief.md`. Não invente ícones de terceiros.
- **Música:** real, quando o usuário pedir. NCS ou outra livre de direitos baixa com `yt-dlp "scsearch1:<busca>"`; o YouTube costuma bloquear. Depois:
  - `run.sh analyze_music.py faixa.mp3` mostra BPM, batida, compasso e candidatos a drop;
  - `run.sh analyze_music.py faixa.mp3 --drop-at 10 --len 30 --out <proj>/assets/audio/music.mp3` corta a faixa com o drop no segundo 10. Use `--drop <s>` para forçar outro drop.

### 3. Projeto
- `bash <skill>/scripts/setup_project.sh <pasta>` copia o template: motor, bibliotecas locais, iPhone GLB, ícones, fontes Figtree e SFX.
- Para partir de um comercial completo de 30 s, use `--example spotify`.

### 4. Roteiro na batida
- Escreva os tempos de cada cena alinhados aos compassos do `analyze_music`. O drop é o momento de maior energia.
- Grave o roteiro em `<proj>/BRIEF.md`. O formato está em `examples/spotify/BRIEF.md`.

### 5. Construir
Edite `<proj>/index.html`. A API do motor está em `references/engine.md`.
- **Tela do celular:** DOM em pt (390×844) dentro de `#ui`, com zoom 3, uma `.pg` por página do app.
- **Câmera:** trilhas `CAM_T`, `CAM_D` (log da distância), `CAM_YAW`, `CAM_PIT`, `CAM_FX` e `PH_RY`. O alvo pode ser um ponto da tela, `S(u,v)`, ou do mundo, `Wp(x,y,z)`.
- **Toques:** lista `TAPS`.
- **Digitação:** `ENG.keyTimes` alimenta o texto, o teclado, a câmera que segue o cursor e os SFX de tecla.
- **SFX:** `ENG.SFX.add(...)` em cada evento; termine com `SFX.publish()`.
- **Obrigatório:** `window.__render = render` e `window.__duration`.

### 6. Revisar com quadros parados (antes de qualquer render)
- `run.sh stills.py <proj> 0.5,2,3.5,… --cols 3` gera a folha em `<proj>/.build/stills/sheet.jpg`.
- Olhe a folha e corrija composição, sobreposição de texto com o celular e legibilidade. Repita até ficar bom: cada folha leva ~1 min.
- Rode também `npx --yes hyperframes@0.8.181 check` como checagem extra de layout e contraste. Falsos positivos de páginas cobertas somem escondendo o que está sob folhas opacas.

### 7. Render
- `run.sh capture.py <proj>`: o padrão `mb30+p60` captura 5 subquadros por quadro de 30 qps (30 s = 4500 capturas). A 1,2–2 capturas/s em 4 núcleos (closes rápidos, planos abertos com 3D mais lentos), isso dá ~40–60 min. É retomável. Para economizar ~20%, use `--mode mb30` (sem a versão 60 qps).
- Para revisar rápido, use `--mode draft` (30 qps sem blur) e `--range 8,12` para só um trecho.
- Rode em segundo plano e acompanhe as linhas de progresso. Não use `hyperframes render`: ele trava com WebGL por software.

### 8. Som e montagem
- `run.sh mix.py <proj>` lê `assets/audio/music.mp3` + `.build/cues.json` e gera `.build/mix.mp3`.
- `run.sh assemble.py <proj> --name <nome>` gera em `<proj>/renders/`:
  - `_1080p30.mp4`, com motion blur de 180° (média de 4 subquadros em luz linear);
  - `_1080p60.mp4`;
  - `_contact-sheet.jpg`.

### 9. Entrega
- Veja a folha de quadros e compare com o roteiro. Mande os arquivos ao usuário.
- Diga o que mudou em relação ao briefing e por quê, por exemplo uma regra de marca ou um ícone indisponível.

## Regras que evitam os erros já vistos
Detalhes e causas em `references/pitfalls.md`.

1. **Nada de `filter: blur()` ou `backdrop-filter` dentro da tela do celular nas cenas de close.** Isso esgota a memória gráfica e o Chrome perde o contexto WebGL. Para sumir, use opacidade e escala. Vidro dentro da tela = gradiente semitransparente + bordas claras.
2. **Celular fora do centro:** use `CAM_FX`, o deslocamento do quadro, e não mova o alvo da câmera. Assim a órbita continua girando em volta do celular e o texto ao lado não colide com ele.
3. **Texto 2D ao lado do celular:** confira na folha de quadros que a palavra mais longa não invade o celular.
4. **Close na tela:** o motor desliga o WebGL quando a tela cobre o quadro inteiro (0,1 s/quadro em vez de 2,4 s). Prefira closes a planos abertos longos com vidro desfocado por cima.
5. **Câmera:** distância sempre em log, para que o zoom tenha velocidade percebida constante. Nunca leve a câmera para trás do plano da tela, ou a homografia quebra.
6. **Marca:** logo oficial de uma cor só (verde sobre preto, branco sobre cor etc.), sem misturar cores nem recolorir. O conteúdo da UI deve ser fictício: nada dos dados pessoais que aparecem nos prints.
7. **Determinismo:** só tempo → estado. Nada de `Math.random` (use `OM.rng(seed)`), `Date` ou estado acumulado entre quadros.
8. **Motion blur:** o 30 qps final usa subquadros reais. Trechos de digitação podem mostrar duas letras sobrepostas no quadro em que a letra aparece, o que é natural num obturador de 180°.

## Arquivos
- `template/`: projeto base (12 s de demonstração).
  - `lib/engine.js`: o motor.
  - `lib/motion-lite.js`: curvas e molas.
  - Assets: iPhone GLB, ícones iOS, Figtree, SFX Pixabay.
- `examples/spotify/`: comercial completo de 30 s, com BRIEF.md, capas fictícias e logos oficiais. A música não vem junto.
- `scripts/`: `run.sh`, `setup_project.sh`, `analyze_music.py`, `stills.py`, `capture.py`, `mix.py`, `assemble.py`.
- `references/`:
  - `engine.md`: API e receitas de cena;
  - `brief.md`: perguntas e checklist;
  - `pitfalls.md`: erros e correções.
