# Opções para criar vídeos com o Claude

Análise de 7 Reels do Instagram: áudio transcrito (Whisper) e quadros revisados.

## Resumo por vídeo

### 1. Paulo Shimada · [Dd4S4nYysi1](https://www.instagram.com/reel/Dd4S4nYysi1/)
- **Idioma e duração:** inglês, 55s, ~4,9 mil curtidas.
- **Tema:** "Claude can finally edit like a pro". O vídeo dele foi editado 100% pelo Claude Opus 5.5.
- **Formato:** tela dividida. Em cima a versão editada, embaixo a "ORIGINAL", com o selo "edited 100% of this video".
- **O que a edição faz:**
  - visão computacional que reconhece os objetos do quarto (máscara, planta, câmeras e ele);
  - transcrição com o tempo de cada palavra e legendas animadas;
  - recorte dele do fundo "como um adesivo";
  - lata de Coca 3D surgindo sobre a mão e acompanhando o movimento;
  - a lata "explodida" em 10 cubos de açúcar, com contagem animada;
  - efeito "Matrix" de código no fim.
- **Gancho:** "comenta EDIT" para receber o guia.
- **Conclusão:** edição de filmagem real por código. É o caso mais avançado tecnicamente, e o guia não é público.

### 2. Vinicius Ply · [DdtIsrLxWU3](https://www.instagram.com/reel/DdtIsrLxWU3/)
- **Idioma e duração:** português, 27s.
- **Tema:** "a Apple divulgou todo o material de design" (Human Interface Guidelines, Apple Design Resources). Há um prompt para colar no Claude Code e ter sites e apps "no padrão Apple".
- **Formato:** filmagem do monitor, com ele em câmera frontal no canto.
- **Gancho:** "comenta APPLE".
- **Conclusão:** é sobre um prompt de design e UI, não sobre vídeo.

### 3. Maximiliano Carrau · [DeFhniokjdr](https://www.instagram.com/reel/DeFhniokjdr/)
- **Idioma e duração:** português, 18s.
- **Tema:** "Acabou pra motion designer". Uma skill do Claude Code lê o projeto de um site e gera um vídeo curto de lançamento, com música, motion e legenda.
- **Formato:** ele embaixo com legendas palavra a palavra; exemplos em cima (CLAUDE motion designer, "EASE", "NEVER NEVER", lançamento do Supabase).
- **Gancho:** "comenta SKILL".
- **Conclusão:** pelo que aparece, é a skill `product-launch-video` do HyperFrames.

### 4. Brennan Wells · [DeQWqNXOa72](https://www.instagram.com/reel/DeQWqNXOa72/)
- **Idioma e duração:** inglês, 43s, ~3,4 mil curtidas.
- **Tema:** o repositório **awesome-opus5-5-videos** (coleção de vídeos virais feitos com o Opus 5.5 e seus prompts; "500+ prompts", hoje são 703).
- **Gancho:** "comenta CLAUDE" para a masterclass.

### 5. Rafa Grandi · [DeZ3jElT3SB](https://www.instagram.com/reel/DeZ3jElT3SB/)
- **Idioma e duração:** português, 26s.
- **Tema:** "Não edita teus vídeos com IA antes de conhecer esse repositório". É o mesmo awesome-opus5-5-videos ("853 prompts").
- **Formato:** ele em câmera, com parede 3D de vídeos e cartões flutuantes.
- **Gancho:** "comenta vídeo".

### 6. Carlos Henrique · [DeeQetjjZdL](https://www.instagram.com/reel/DeeQetjjZdL/)
- **Idioma e duração:** português, 62s.
- **Tema:** "5 ferramentas para criar vídeos com o Claude":
  1. **HyperFrames** (HeyGen): cenas em HTML viram vídeo.
  2. **onetake**: movimento contínuo, sem cortes; versão grátis só para uso não comercial.
  3. **Collage B-roll**: recortes de papel que se montam peça por peça; animação com a IA do Google (Gemini).
  4. **Claude Animation Base**: desenhos com cara de pintura à mão, incluindo o mascote do Claude Code.
  5. **Lemo-Opuscar**: 43 estilos de filme feitos só com código, sem modelo de geração de vídeo.
- **Formato:** motion graphics puro (fundo escuro, serifa itálica laranja, carrossel 1–5).
- **Gancho:** seguir o perfil.

### 7. Paz Chen · [Dep0wuhvizo](https://www.instagram.com/reel/Dep0wuhvizo/)
- **Idioma e duração:** inglês, 102s, formato 1:1.
- **Tema:** o criador do **OpenFilm** apresentando a ferramenta. Agente de vídeo gratuito e de código aberto (licença MIT) para Codex, Claude Code e outros:
  - corta os "hums", escolhe takes, coloca legenda, B-roll, cor, motion, voz e música;
  - tem editor visual: clicar, mover, escalar, colorir, ou desenhar uma caixa e pedir ao agente;
  - instala com uma linha e exporta em vários formatos.
- **Gancho:** "o comentário mais curtido, eu faço".

## Visão geral

- **Ferramentas citadas:** HyperFrames, onetake, OpenFilm, Collage B-roll, Claude Animation Base e Lemo-Opuscar.
- **Coleção de prompts:** awesome-opus5-5-videos (aparece em 2 vídeos).
- **Edição de filmagem real com visão computacional:** só o do Paulo Shimada.
- **Padrão dos criadores:** promessa forte, demonstração rápida, legenda palavra a palavra e "comenta X".

## Situação no nosso ambiente

| Opção | Status |
|---|---|
| HyperFrames (+ 21 skills) | Instalado e testado (`/home/user/hf-studio`) |
| onetake | Instalado e testado (`/home/user/onetake`) |
| OpenFilm | Instalado e usado (vídeo da Luna, VESPER, apresentação do Claude) |
| awesome-opus5-5-videos | Baixado (`/home/user/awesome-opus5-5-videos`) |
| OpenMontage | Instalado (`/home/user/OpenMontage`) |
| Collage B-roll, Claude Animation Base, Lemo-Opuscar | Ainda não instalados |
| Pipeline de visão computacional (Paulo Shimada) | Não disponível publicamente |

## Qual é a melhor para um vídeo "nível After Effects"?
(liquid glass, câmera contínua que acompanha, cursor, motion blur)

**Recomendação: HyperFrames como base, com o método do onetake.**

| Requisito | HyperFrames | onetake | OpenFilm | Lemo-Opuscar / Collage / Animation Base |
|---|---|---|---|---|
| Liquid glass | Blocos prontos com shader de refração real (`vfx-liquid-glass`, `liquid-glass-widgets`, `ios26-liquid-glass`, `macos-tahoe-liquid-glass`) | Não tem pronto (só CSS feito à mão) | Não tem pronto | Não |
| Câmera contínua | `cursor-zoom-follow`, `camera-rig-depth-stack`, `zoom-through-transition`, `push-in` + skill de keyframes | O ponto forte: um operador de câmera (segue, chicoteia, flutua, treme no impacto) e cenas que nascem umas das outras | Básico | Não é o foco |
| Cursor | `agent-cursor`, `cursor-zoom-follow`, `cursor-text-select`, `cursor-context-menu` | `OM.cursor`: a "mão" causa cada reação | Não tem pronto | Não |
| Motion blur | Não tem nativo (60 fps + mesclagem de quadros resolve) | Real (obturador de 180°), 4K60 | Não | Não |
| Controle de qualidade | `check` (layout, contraste) | Oráculo que reprova filme "slideshow" | `look` | Não |
| Licença | Apache 2.0 (pode uso comercial) | Só não comercial (versão grátis) | MIT | MIT / variadas |

- **Lemo-Opuscar:** 43 estilos artísticos (pintura, aquarela, nanquim), não interface de produto.
- **Collage B-roll:** recorte de papel.
- **Claude Animation Base:** desenho à mão com o mascote.
- **Pipeline:** blocos de liquid glass e cursor do HyperFrames + uma câmera única que nunca corta (método onetake) + motion blur (60 fps mesclados) + som sincronizado.
