# Análise de referências

Screenshots em `docs/referencias/<site>/<site>-{desktop,mobile}.png` (1440x900 e 390x844, tema escuro).
Capturadas com Playwright/Chromium em 10/10/2026.

**Não capturados:** claude.ai, chatgpt.com e app.leonardo.ai bloqueiam navegador automatizado (Cloudflare / Vercel checkpoint, HTTP 403/429).
Para esses três a análise usa o produto logado conhecido; os padrões descritos são os do app (sidebar, composer, thread).
runway (desktop) e raycast (desktop) estouraram timeout no carregamento; as versões mobile foram salvas.

---

## higgsfield.ai (referência principal de função)

- **Layout:** nav horizontal densa no topo, com muitos itens e selos "New/Top". Abaixo, mídia gigante com bordas arredondadas (~16px) e um composer flutuando sobre a mídia na base. No app logado, a lógica é: escolher a ferramenta (Image/Video/Audio...) e cair num composer único.
- **Seletor de modelo:** é um chip no composer (`Nano Banana Pro`, `Seedance 2.0`) com o ícone do provedor. Os parâmetros ficam em chips logo ao lado (`3:4`, `8s`, `Auto`, `On`), e cada chip abre um popover. Só aparecem os parâmetros do modelo atual. Esse é o padrão a copiar.
- **Anexos:** botão `+` à esquerda do campo de prompt. No app logado, os slots aparecem por modelo (start/end frame, referência).
- **Carregamento:** cards com placeholder escuro e progresso. O resultado entra no grid do histórico.
- **Paleta:** quase preto (#0b0b0b) com accent lima neon (#d4ff3a) no CTA "Generate". O lima é chamativo e parece marketing.
- **Tipografia:** grotesca condensada em caixa alta para títulos (marketing) e sans neutra na UI.
- **Espaçamento:** composer com padding de ~16px, chips com altura de ~32px e raio de ~8px.
- **Animação:** hero em vídeo autoplay, hovers com escala leve.
- **Copiar:** composer com chips de parâmetro, modelo como chip, parâmetros dinâmicos por modelo e encadeamento (Animate, Upscale) a partir do resultado.
- **Evitar:** o excesso de selos "New", o accent neon, o banner de cookie e a nav com 12 itens.
- **Mobile:** pills horizontais roláveis por categoria, cards de mídia com raio grande e busca fixa na base.

## krea.ai

- **Layout:** sidebar fixa à esquerda (~256px) com grupos ("Tools") e itens de ícone colorido + label. A área central traz cards grandes.
- **Hierarquia:** itens de navegação com 37px de altura, item ativo com fundo de superfície (#1f1f1f) e raio de 8px.
- **Paleta:** preto puro com superfícies em cinza neutro; ícones de app coloridos (que vamos evitar, nosso ícone é monocromático).
- **Copiar:** sidebar silenciosa, item ativo marcado só por superfície e rodapé da sidebar com ação secundária.
- **Evitar:** o botão "Pricing" com gradiente e glow azul (cara de IA) e os ícones multicoloridos.

## runwayml.com / app

- Site de marketing é editorial. O app tem sidebar de ferramentas + canvas central + painel de parâmetros à direita.
- **Copiar:** parâmetros técnicos em mono, timeline/duração bem legível.
- **Evitar:** o painel lateral permanente, que ocupa espaço. Em vez dele, os parâmetros ficam em popovers no composer.

## app.leonardo.ai (bloqueado, análise do app)

- Painel esquerdo de parâmetros muito longo (dezenas de controles visíveis), galeria à direita.
- **Evitar:** mostrar todos os parâmetros de uma vez. Nosso "Avançado" esconde o resto.

## freepik.com/pikaso (Magnific)

- Marketing com gradiente vinho e muita foto. No app, o composer fica centralizado e o grid de resultados embaixo.
- **Copiar:** busca/criação unificada ("Search or create").
- **Evitar:** o gradiente de fundo e o banner promocional.

## claude.ai (bloqueado, análise do app)

- **Layout:** sidebar recolhível (~260px) com "New chat", lista de conversas agrupada por data e perfil no rodapé. A thread fica centralizada (max ~720px) e o composer flutua na base com raio de ~16px, borda de 1px e superfície levemente elevada.
- **Composer:** textarea auto-resize; linha inferior com anexar à esquerda e modelo + enviar à direita. As miniaturas dos anexos ficam acima do texto dentro do mesmo container, e o composer cresce suavemente.
- **Estados:** streaming com cursor e mensagem do usuário alinhada à direita em bolha de superfície.
- **Tipografia:** sans de UI de 14-15px, line-height generoso, cinzas quentes.
- **Copiar:** a estrutura sidebar + thread + composer, a lista agrupada por data (Hoje, Ontem, 7 dias), o composer que cresce e o atalho Enter/Shift+Enter.

## chatgpt.com (bloqueado, análise do app)

- Sidebar com busca e lista; composer em pill grande com "+", ferramentas e voz.
- **Copiar:** a busca na sidebar e o botão de ferramentas ("+") que abre um menu de modos.
- **Evitar:** o raio de pill exagerado no composer (estoura nossa escala de 8-14px).

## linear.app

- **Acabamento de referência:** preto (#08090a) e superfícies (#0f1011 / #141516), bordas de 1px em rgba(255,255,255,0.08), texto primário #f7f8f8 e secundário #8a8f98.
- **Tipografia:** sans de UI de 13-14px na app, títulos com tracking negativo e metadados em cinza. Ícones de 16px com traço fino.
- **Espaçamento:** grid de 4px, linhas de navegação com 28-32px de altura, densidade alta sem aperto.
- **Animação:** transições de 150-200ms com ease-out e quase nenhuma sombra.
- **Copiar:** os tokens de superfície/borda, a densidade, a tipografia pequena e precisa e o foco visível discreto.

## vercel.com

- Preto/branco com Geist e Geist Mono, grid de linhas finas e accent quase inexistente.
- **Copiar:** Geist + Geist Mono, a mono para IDs/status e os botões primários sólidos claros no escuro.

## raycast.com

- Command palette como peça central: lista com ícone + título + atalho em `<kbd>` à direita, seção agrupada e busca no topo.
- **Copiar:** o visual do Cmd+K (altura de item 36-40px, agrupamento, `kbd` em mono) e o feedback de seleção por superfície.

---

## Síntese para o Studio

1. Estrutura Claude (sidebar + thread + composer fixo) com o composer de chips da Higgsfield.
2. Acabamento Linear/Vercel: superfícies por contraste, borda de 1px, Geist, densidade média-alta.
3. Command palette estilo Raycast.
4. Um accent só, fora do clichê lima/roxo, usado no Gerar, no foco e no progresso.
5. Nada de hero, banner, selo "New" ou gradiente.
