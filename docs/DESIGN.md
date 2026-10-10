# Studio: sistema de design

**Leitura (taste skill):** ferramenta de produção de mídia para um único usuário avançado, com linguagem utilitária e silenciosa no estilo Linear, apoiada em Tailwind v4 + shadcn/ui customizado + Geist + Motion contido.

**Dials:** DESIGN_VARIANCE 3 (ferramenta previsível) · MOTION_INTENSITY 4 (feedback e transição de estado, nada decorativo) · VISUAL_DENSITY 6 (app diário, denso sem aperto).

O conteúdo gerado é a cor da tela. A interface fica neutra para não competir com a mídia.

---

## 1. Cor

Escala neutra levemente quente (stone), definida em OKLCH e exposta como CSS vars.
Dark é o padrão; o light é completo. O tema segue o sistema até haver escolha manual (cookie `theme`).

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--bg` | oklch(0.155 0.004 60) | oklch(0.985 0.002 75) | fundo da página |
| `--surface-1` | oklch(0.185 0.004 60) | oklch(1 0 0) | sidebar, composer |
| `--surface-2` | oklch(0.215 0.005 60) | oklch(0.965 0.003 75) | hover, chips, inputs |
| `--surface-3` | oklch(0.255 0.006 60) | oklch(0.935 0.004 75) | ativo/pressionado |
| `--border` | oklch(1 0 0 / 0.075) | oklch(0.2 0.01 60 / 0.09) | divisórias 1px |
| `--border-strong` | oklch(1 0 0 / 0.13) | oklch(0.2 0.01 60 / 0.16) | campos, foco secundário |
| `--fg` | oklch(0.96 0.003 75) | oklch(0.2 0.006 60) | texto primário |
| `--fg-muted` | oklch(0.72 0.006 70) | oklch(0.45 0.008 60) | secundário (AA) |
| `--fg-subtle` | oklch(0.56 0.006 70) | oklch(0.58 0.008 60) | metadados, placeholders |
| `--accent` | oklch(0.72 0.15 48) | oklch(0.6 0.16 45) | Gerar, foco, progresso |
| `--accent-fg` | oklch(0.18 0.02 48) | oklch(0.99 0 0) | texto sobre accent |
| `--danger` | oklch(0.68 0.17 25) | oklch(0.55 0.19 25) | erro |
| `--success` | oklch(0.74 0.13 150) | oklch(0.52 0.13 150) | concluído (uso raro) |

O accent **ember** (laranja queimado) é usado só no botão Gerar, no anel de foco, na barra de progresso, no item ativo do seletor de modo (o indicador) e na seleção. Nunca vira fundo grande.
Proibido: gradientes, glow e roxo/azul.

## 2. Tipografia

- **Sans:** Geist (pacote `geist`, via next/font, sem rede no build).
- **Mono:** Geist Mono, para seed, IDs, duração, custo, resolução e atalhos.

| Token | Tamanho/linha | Peso | Uso |
|---|---|---|---|
| `text-2xs` | 11/16 | 500 | rótulos de grupo, kbd |
| `text-xs` | 12/16 | 400-500 | metadados, chips |
| `text-sm` | 13/20 | 400-500 | UI padrão (botões, menu, sidebar) |
| `text-base` | 14/22 | 400 | prompt, mensagens |
| `text-lg` | 16/24 | 500 | títulos de seção |
| `text-xl` | 20/28 | 600, tracking -0.01em | títulos de página |

Sem eyebrow em caixa alta. Rótulos de grupo usam `text-2xs` com `--fg-subtle` em caixa normal.
Sem travessão (— ou –) em nenhum texto visível.

## 3. Espaço, raio e borda

- **Grid de 4px.** Espaçamentos usados: 4, 8, 12, 16, 20, 24, 32, 48.
- **Raio:** 6px (kbd, chips pequenos), 8px (botões, inputs, itens de menu), 10px (cards de mídia, popovers), 14px (composer, dialogs). Nada acima de 14, e nada em pill além de toggles e avatares.
- **Borda:** 1px `--border` sempre. Sombra só em popovers e dialogs, `0 8px 24px -8px oklch(0 0 0 / 0.35)` no dark e 0.12 no light.
- **Alturas:** botão/chip de 32px (sm 28px), item de sidebar de 32px, input de 36px e item da command palette de 36px.

## 4. Ícones

Lucide (pedido explícito do usuário, override da preferência da taste skill), sempre com `strokeWidth 1.75` e tamanho 16px (14px em chips). Um ícone por ação, nunca decorativo em título.

## 5. Componentes

- **Sidebar** (260px, recolhível para 0 com animação de largura via grid-template-columns): botão Nova, busca, conversas agrupadas (Hoje, Ontem, 7 dias, Mais antigas), links (Biblioteca, Personagens, Presets, Configurações) e saldo no rodapé em mono. No mobile vira drawer com overlay.
- **Thread:** coluna de no máximo 820px. A mensagem do usuário é alinhada à direita, em bloco `--surface-2` com raio de 14px, com prompt, miniaturas e chips de parâmetros. A resposta é o card de resultado, sem bolha.
- **Card de resultado:** grid de saídas (1-4 colunas conforme a quantidade, proporção real). Cabeçalho em linha com modelo, status e tempo; rodapé com metadados em mono e ações em ícones com tooltip. Ações encadeadas ficam num menu "Continuar com" (Animar, Upscale, Usar como referência, Estender, Remover fundo).
- **Composer** (raio de 14px, `--surface-1`, borda forte): seletor de modo segmentado, chips de subtipo, slots de anexo, textarea, barra de chips de parâmetros, custo e o botão Gerar.
- **Seletor de modo:** controle segmentado; o indicador desliza com `layoutId`.
- **Chips de parâmetro:** com 28px de altura, mostram ícone + valor; abrem popover com opções em lista (enum), slider (faixa numérica) ou input (seed).
- **Popover de modelo:** busca no topo, lista agrupada por categoria e, em cada item, nome, descrição curta e custo em mono à direita.
- **Command palette (Cmd/Ctrl+K):** padrão Raycast, com grupos Modos, Modelos, Conversas e Páginas.
- **Lightbox:** fundo `--bg` a 96% de opacidade, mídia centralizada, setas ←/→, Esc fecha, comparação antes/depois com divisor arrastável.
- **Player:** `<video>` nativo sem controles, com barra própria (play, tempo em mono, scrub, mudo, tela cheia).

## 6. Movimento

- **Easing padrão:** `cubic-bezier(0.2, 0.8, 0.2, 1)` (ease-out). As durações são 150ms (hover/cor), 200ms (entrada/saída) e 250ms (layout).
- **Spring** (só em popovers e layout): `{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }`.
- **Composer:** a altura anima via `motion.div layout` quando slots ou anexos aparecem.
- **Geração:** skeleton com shimmer discreto (gradiente de 8% de opacidade, 1.6s linear, só `background-position`). Quando houver progresso real, a barra accent de 2px avança. A revelação final passa de `filter: blur(12px)` e opacity 0.6 para nítido em 400ms.
- **Mensagens novas:** opacity 0→1 com y 6→0 em 200ms.
- **Reduced motion:** `useReducedMotion()` + `MotionConfig reducedMotion="user"`; o shimmer vira estático e a revelação fica sem blur.
- **Performance:** só transform/opacity/filter animados. Vídeos usam `preload="none"` + poster e tocam no hover/visíveis (IntersectionObserver); imagens com lazy load.

## 7. Estados

- **Vazio:** texto curto e funcional, mais 3-4 atalhos de ação reais (ex.: "Retrato em luz de janela", "Animar uma imagem"). Sem ilustração.
- **Carregando:** skeleton no formato final.
- **Erro:** inline no card, com mensagem em PT-BR e botão Tentar de novo.
- **Sem créditos:** banner fino acima do composer com o saldo e o custo.
- **Offline:** faixa fixa no topo, "Sem conexão. Tentando reconectar."
- **Sessão expirada:** redireciona para /login?next=..., com aviso.

## 8. Acessibilidade

- Contraste AA em todos os pares texto/superfície (verificado nos tokens acima).
- Foco visível: `outline 2px var(--accent)` com offset de 2px, só com `:focus-visible`.
- Todos os botões de ícone com `aria-label` e tooltip.
- Navegação completa por teclado: Tab, setas nos menus/segmented, Esc fecha camadas.
