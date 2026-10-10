# Studio

Estúdio pessoal de geração de mídia sobre a API da Higgsfield. Interface de chat: escolha o modo (Imagem, Vídeo, Editar, Apps), o modelo, anexe arquivos e gere. Tudo fica salvo no Supabase (Postgres + Storage).

Produção: https://studio-higs.vercel.app (protegido por senha).

## Stack

- Next.js 16 (App Router, Proxy) + TypeScript estrito
- Tailwind CSS v4 com tokens próprios (`docs/DESIGN.md`), componentes no padrão shadcn/ui sobre Radix
- Motion, Zustand, TanStack Query, Lucide
- Supabase: Postgres (Drizzle, schema `studio`) e Storage (bucket privado `studio`)
- Vercel (funções em `gru1`, perto do Supabase em `sa-east-1`)

## Como rodar local

```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev                  # http://localhost:3000
```

Para atualizar o catálogo de modelos (lista da conta, schemas da documentação e custos):

```bash
node --env-file=.env.local scripts/sync-catalog.mjs
```

Gera `lib/catalog/generated/*.json` e `docs/API_MAP.md`. Modelo novo na conta aparece no app depois de rodar o script; ajustes de rótulo e classificação ficam em `lib/catalog/overrides.ts`.

## Variáveis de ambiente

Todas são **somente do servidor** (nenhuma tem prefixo `NEXT_PUBLIC_`).

| Variável | Para quê |
|---|---|
| `HIGGSFIELD_API_KEY_ID`, `HIGGSFIELD_API_KEY_SECRET` | Credenciais da API Higgsfield (`Authorization: Key id:secret`) |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVER_KEY` | Service role key (preferível). Com a anon key também funciona, graças às policies do bucket `studio` (ver abaixo); ela nunca vai para o navegador |
| `SUPABASE_BUCKET` | Bucket de arquivos (padrão `studio`) |
| `SUPABASE_MAX_UPLOAD_MB` | Limite por arquivo no Storage (padrão 50, o do plano gratuito). Acima disso o arquivo vai para o storage da Higgsfield |
| `DATABASE_URL` | Postgres via pooler em modo transação (porta 6543). Use o host exato do painel (`aws-1-...`) |
| `APP_PASSWORD` | Senha de acesso ao app |
| `SESSION_SECRET` | Segredo HMAC do cookie de sessão (32+ bytes aleatórios) |
| `WEBHOOK_SECRET` | Token do webhook da Higgsfield (vai na query string) |
| `APP_URL` | Opcional. URL pública para o webhook; em produção na Vercel é detectada sozinha |

## Banco de dados

O schema fica em `lib/db/schema.ts` e as migrations em `drizzle/`.

```bash
npx drizzle-kit generate   # gera SQL a partir do schema
npx drizzle-kit migrate    # aplica (requer DATABASE_URL com permissão de DDL)
```

O app usa um role dedicado (`studio_app`) com acesso só ao schema `studio`. As tabelas têm RLS ativo, e o schema não é exposto pela API REST do Supabase. O bucket `studio` é privado; todo acesso usa URLs assinadas.

## Deploy (Vercel)

1. Projeto ligado ao repositório (`studio-higs`). Um push na branch de produção faz o deploy.
2. Configure todas as variáveis acima em Project Settings > Environment Variables.
3. Região das funções: `gru1` (Settings > Functions).
4. Deployment Protection desligada: o acesso é controlado pelo login do próprio app.
5. Em produção, o webhook da Higgsfield aponta para `/api/webhooks/higgsfield?token=WEBHOOK_SECRET`. O polling continua como recuperação.

## Como funciona

- **Proteção:** `proxy.ts` exige a sessão em todas as páginas e rotas de API (exceto `/login`, o login e o webhook, que é autenticado por token). Cada rota também verifica a sessão. Rate limit de gerações no banco.
- **Geração:** `POST /api/generations` valida contra o schema do modelo e envia à Higgsfield com `Idempotency-Key`. A rota retorna na hora; o cliente faz polling em lote (`/api/generations/poll`, backoff de 2s a 6s) e o webhook acelera a conclusão. Ao concluir, as saídas são copiadas da CDN da Higgsfield para o Storage (as URLs de lá expiram em cerca de 7 dias).
- **Uploads:** o navegador envia direto para o Storage via URL assinada, sem passar pelas funções da Vercel (limite de 4,5 MB). Arquivos acima do limite do Supabase vão para a URL pré-assinada da Higgsfield.
- **Catálogo:** `lib/catalog` deriva modos, subtipos, slots de anexo e parâmetros a partir do JSON Schema de cada modelo. O composer é gerado a partir dele.

## Estrutura

```
app/
  (app)/                 páginas autenticadas (layout com sidebar)
    (studio)/            Studio: / e /c/[id] (composer no layout)
    biblioteca/ g/[id]/ personagens/ presets/ config/
  api/                   rotas do servidor (proxy da Higgsfield, uploads, dados)
  login/
components/
  shell/                 sidebar, command palette, app shell
  studio/                composer, chips, slots, thread, card de resultado
  media/                 player, miniaturas, lightbox
  pages/                 telas secundárias
  ui/                    primitivos (button, popover, dialog, menu...)
lib/
  catalog/               catálogo tipado + regras de UI
  higgsfield/            cliente da API (só servidor)
  server/                sessão, erros, storage, gerações, DTOs
  client/                stores (Zustand), queries, upload
  db/                    schema Drizzle
scripts/sync-catalog.mjs
docs/                    ANALISE.md, DESIGN.md, API_MAP.md, referências
```

## Limites conhecidos

- A API da Higgsfield não tem endpoint de saldo. O app mostra o gasto (estimativas das gerações concluídas) e o link para o console.
- A API não oferece modelos de áudio (TTS, troca de voz, dublagem), upscale, remoção de fundo nem lipsync, então essas categorias não aparecem. Se surgirem na conta, basta rodar o `sync-catalog`.
- Soul 2 image-to-image e AI Influencer estão na conta, mas sem schema público na documentação, então ficam de fora.
