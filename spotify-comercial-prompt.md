# Prompt — Comercial Spotify "Ouça o que você sente." (30 s · 16:9)

> Peça de estudo interno, não é campanha oficial. Usa o kit de marca oficial da Spotify (2024).

## 1. Briefing

| Item | Definição |
|---|---|
| Objetivo | Apresentar o Spotify num tour pelo app que vira experiência sensorial e fecha na marca |
| Duração | 30,0 s exatos |
| Formato | 16:9, 1920×1080, render a 60 fps → motion blur por mesclagem de quadros → entrega 30 fps (e versão 60 fps) |
| Dispositivo | iPhone 3D com iOS 26 (liquid glass) |
| Idioma | Português (pt-BR) |
| Clima | Escuro e verde neon: fundo `#121212`/preto profundo, verde `#1ED760`, reflexos de vidro e brilhos coloridos das capas |
| Slogan final | **"Ouça o que você sente."** |
| Áudio | Música + SFX, sem narração |
| Músicas, artistas e números | Fictícios |

## 2. Assets (já baixados em `/home/user/hf-studio/spotify-ad/assets`)

- **Marca (oficial, developer.spotify.com/documentation/design):**
  - `brand/Primary_Logo_Green_RGB.svg`, `brand/Primary_Logo_White_RGB.svg` (ícone);
  - `brand/Full_Logo_Green_RGB.svg`, `brand/Full_Logo_White_RGB.svg` (ícone + wordmark);
  - **Regras:** não distorcer, girar nem recolorir o logo; no fechamento usar o logo completo (ícone + wordmark).
- **Cores oficiais:** verde `#1ED760`, preto `#121212`, branco `#FFFFFF`, cinzas `#7F7F7F` / `#EEEEEE`.
- **Fonte:** a Spotify usa a "Spotify Mix", que é proprietária. Substituta: **Figtree** (400–900), arquivos locais.
- **Música:** `audio/sky-high-cut.mp3` — **Elektronomia, "Sky High" [NCS Release]** (NoCopyrightSounds, uso livre com crédito), trecho 89,42–119,42 s da faixa.
  - 129,2 BPM → **1 batida = 0,464 s**, 1 compasso = 1,858 s.
  - **Drop no segundo 10,00** do comercial.
  - Compassos depois do drop: 10,00 · 11,86 · 13,72 · 15,57 · 17,43 · 19,29 · 21,15 · 23,00 · 24,86 · 26,72 · 28,58.
  - Antes do drop (build-up): 0,71 · 2,57 · 4,43 · 6,29 · 8,14.
- **Capas dos álbuns (fictícias):** 6 capas geradas no nosso Studio (Qwen Image 3, 1:1, ~0,64 cr cada).

## 3. Ferramentas e técnicas (usar todas)

- **HyperFrames** (composição + render), com blocos do catálogo:
  - `ios26-liquid-glass` (iPhone 3D, home do iOS 26, ícones em liquid glass, wallpaper shader);
  - `vfx-liquid-glass` e `liquid-glass-widgets` (painéis com refração real);
  - `cursor-zoom-follow` (câmera persegue cada toque/clique) e `agent-cursor` (adaptado para ponteiro de toque circular do iPadOS/iOS);
  - `zoom-through-transition` (atravessar ícone/capa até a próxima cena) e `camera-rig-depth-stack` (profundidade e paralaxe);
  - skill `hyperframes-keyframes` para punch-in, whip pan, máscaras e órbitas 3D.
- **Método onetake:**
  - **uma câmera contínua que nunca corta** (OM.camera com flutuação de câmera na mão, whip entre alvos e tremida no impacto do drop);
  - **cada cena nasce da anterior** (carry);
  - o **cursor/toque causa cada reação**;
  - curvas medidas (springs) da `motion.js`.
- **Motion blur:** render a 60 fps + mesclagem de 2 quadros (obturador de 180°).
- **Som:** música + SFX sincronizados aos eventos (toque, vidro, whoosh nos movimentos de câmera, digitação, sub-hit reforçando o drop).
- **Controle:** `hyperframes check` sem erros; snapshots de cada cena; comparação de ritmo com a batida.

## 4. Roteiro com tempos (cravado na batida)

**0,00–2,57 · Abertura (build-up suave)**
- Preto. Um feixe de luz verde varre uma superfície escura e brilhante.
- A câmera faz dolly até o iPhone 3D flutuando em 3/4; a tela acende com a home do iOS 26 em liquid glass.
- Texto fino em Figtree: **"O que você quer sentir hoje?"** (palavra por palavra, 0,9–2,3 s).

**2,57–5,10 · Procurando o app (carrossel horizontal)**
- A câmera entra na tela. Uma fila **horizontal de 7 ícones em liquid glass** desliza (Mapas, Câmera, Notas, Clima, Fotos, Mensagens, **Spotify**).
- Uma **lente de vidro** (bolha com refração) passa sobre cada ícone, ampliando-o; a câmera acompanha lateralmente.
- A fila desacelera e o Spotify para no centro no compasso de **4,43**; o ícone oficial ganha brilho verde pulsante.

**5,10–6,29 · Toque e mergulho**
- O ponteiro de toque circular entra em curva e toca o ícone em **5,20** (encolhe 0,84 por 0,14 s, ondulação de vidro).
- `zoom-through`: a câmera atravessa o ícone e chega ao splash (ícone sobre `#121212`) no compasso de **6,29**.

**6,29–10,00 · Busca (tensão crescente)**
- Tela de busca do app reconstruída em HTML (fundo `#121212`), barra de busca em liquid glass.
- Punch-in na barra; digitação **"músicas pra dirigir à noite"** com a câmera seguindo o caret (`cursor-zoom-follow`), de 6,9 a 8,6.
- Os resultados caem em cascata, um por batida (capas fictícias): "Luz de Neon — Aurora Vale", "Avenida 2AM — Kairo", "Ressaca de Domingo — Marina Sol".
- Toque no primeiro resultado em **9,30**.
- De 9,50 a 10,00 tudo se contrai num ponto de luz verde (antecipação) e a tela fica preta por 2 quadros.

**10,00 · DROP — Tocando agora**
- Explosão de luz. Player em tela cheia: capa de "Luz de Neon", título e artista, barra de controles em liquid glass, progresso andando.
- A cor dominante da capa inunda o fundo (gradiente vivo).
- A câmera **orbita o iPhone 3D** de 10,0 a 13,7, com um pulso de escala a cada batida e uma tremida curta no impacto do drop.
- Letra fictícia sincronizada em karaokê (uma linha por compasso):
  - "Acendi a cidade inteira" (10,0)
  - "só pra te ver passar" (11,86)

**13,72–17,43 · DJ com IA**
- O toque abre o chip de vidro **"DJ"**.
- Campo de prompt: **"Monta uma playlist pra uma noite de chuva em SP"**, digitado de 14,0 a 15,4, com faísca de IA.
- A playlist **"Noite de chuva em SP"** se monta: 6 faixas caem, uma por batida, a partir de 15,57, cada uma com sua capa.
- A câmera desce em dolly ao longo da lista.

**17,43–24,86 · Wrapped (cor explode, um card por compasso, transições em whip)**
- A câmera atravessa a capa da playlist e cai no "mundo Wrapped": painéis coloridos em movimento sob cards de liquid glass, com base escura e neon.
- Os cards (contadores animados):
  1. 17,43 — **"48.392 minutos ouvidos"**
  2. 19,29 — **"Top artista: Aurora Vale"** (capa girando)
  3. 21,15 — **"Gênero do ano: Synth-pop noturno"**
  4. 23,00 — **"Você está no top 0,5% dos fãs"**

**24,86–28,58 · Sensorial → marca**
- Os cards se dissolvem numa **onda sonora** que pulsa com a batida.
- A onda se dobra nos **três arcos** do ícone, que se monta em liquid glass com refração e brilho verde.
- O slogan entra palavra por palavra, na batida:
  - **"Ouça"** 24,86
  - **"o que"** 25,79
  - **"você"** 26,26
  - **"sente."** 26,72

**28,58–30,00 · Fechamento**
- O logo completo oficial (branco + ícone verde) centralizado sobre `#121212`.
- Linha minúscula embaixo: *"Peça conceitual — estudo"*.
- A música faz fade-out até 30,0.

## 5. Especificações de UI (reconstruir em HTML, sem gravação de tela)

- **Fundo do app:** `#121212`; cards `#1F1F1F`; texto principal branco, secundário `#B3B3B3`; destaque `#1ED760`.
- **Liquid glass:** blur do fundo + refração (shader do bloco `vfx-liquid-glass`), borda clara de 1–1,5 px, brilho especular que se move com a câmera.
- **Ponteiro de toque:** círculo cinza translúcido (~44 px) que encolhe no toque e deixa uma ondulação.
- **Tipografia:** Figtree 400 (corpo), 700 (títulos), 900 (números do Wrapped).

## 6. Entregas

1. `spotify-ouca-o-que-voce-sente_30s_1080p30.mp4` (com motion blur)
2. `spotify-ouca-o-que-voce-sente_30s_1080p60.mp4`
3. Folha de quadros (contact sheet) e projeto HyperFrames editável em `/home/user/hf-studio/spotify-ad`

## 7. O que ainda melhoraria o resultado (opcional)

- **Prints reais do app Spotify no iPhone** (busca, player, DJ e Wrapped) para reconstruir a interface com fidelidade.
- Sem eles, reconstruo pela identidade visual pública do app.
