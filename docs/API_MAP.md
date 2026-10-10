# Mapa da API Higgsfield

Gerado por `scripts/sync-catalog.mjs` em 2026-10-10. Fontes: `GET /models` (conta), docs oficiais (`llms-full.txt`) e `POST /estimate/<slug>`.

## Base

- Base URL: `https://api.higgsfield.ai`. Auth: `Authorization: Key <ID>:<SECRET>` (somente servidor).
- Submissão: `POST /<slug>` com JSON. Header opcional `Idempotency-Key`. Webhook: query `?hf_webhook=<url https>`.
- Resposta: `{ status, request_id, status_url, cancel_url }`. Status: `queued`, `in_progress`, `completed`, `failed`, `nsfw`, `canceled`.
- Status: `GET /requests/{id}/status` (saída em `images[]`, `video`, `audio`). Cancelar: `POST /requests/{id}/cancel` (202, só enquanto `queued`).
- Upload: `POST /files/generate-upload-url {content_type}` -> `{upload_url, public_url, upload_headers}`; PUT do arquivo. Tipos: jpeg, png, webp, gif, wav, mp4.
- Estimativa: `POST /estimate/<slug>` com o mesmo corpo -> `{type:'estimate', credits, usd}` ou `{type:'description', pricing_description}`.
- Catálogo: `GET /models`. Estilos SOUL: `GET /v1/text2image/soul-styles` e `/v2`. Presets: `GET /models/higgsfield/genjutsu/restyle/v1.0/presets`, `GET /marketing-studio/image/presets`.
- Personagens (Soul ID): `POST /v1/custom-references`, `GET /v1/custom-references/{id}`, `GET /v1/custom-references/list?page=&page_size=`.
- Saldo de créditos: **não há endpoint documentado** na API. Erro `403 not_enough_credits` indica saldo insuficiente.
- Erros: 400 (parâmetro/concorrência), 401 (credencial), 403 (créditos), 404, 422 (validação), 423 (modelo bloqueado), 500, 503.
- Saídas ficam disponíveis por ao menos 7 dias; o app copia tudo para o Supabase Storage.

## Resumo

| Modelo | Slug | Categoria | Saída | Custo (padrões) |
|---|---|---|---|---|
| Happy Horse 1.0 — Image to video | `alibaba/happy-horse/image-to-video` | Vídeo | video | 9.52 cr (US$ 0.595) |
| Happy Horse 1.0 — Reference to video | `alibaba/happy-horse/reference-to-video` | Vídeo | video | 9.52 cr (US$ 0.595) |
| Happy Horse 1.0 — Text to video | `alibaba/happy-horse/text-to-video` | Vídeo | video | 9.52 cr (US$ 0.595) |
| HappyHorse 1.1 — Image to video | `alibaba/happy-horse/v1.1/image-to-video` | Vídeo | video | 12.24 cr (US$ 0.765) |
| HappyHorse 1.1 — Reference to video | `alibaba/happy-horse/v1.1/reference-to-video` | Vídeo | video | 12.24 cr (US$ 0.765) |
| HappyHorse 1.1 — Text to video | `alibaba/happy-horse/v1.1/text-to-video` | Vídeo | video | 12.24 cr (US$ 0.765) |
| Qwen Image 3 — Edit images | `alibaba/qwen-image-3/edit` | Edição de imagem | image | 0.64 cr (US$ 0.04) |
| Qwen Image 3 — Text to image | `alibaba/qwen-image-3/text-to-image` | Imagem | image | 0.64 cr (US$ 0.04) |
| Wan 3.0 Prime — Image to video | `alibaba/wan-3.0-prime/image-to-video` | Vídeo | video | 19.04 cr (US$ 1.19) |
| Wan 3.0 Prime — Reference to video | `alibaba/wan-3.0-prime/reference-to-video` | Vídeo | video | 19.04 cr (US$ 1.19) |
| Wan 3.0 Prime — Text to video | `alibaba/wan-3.0-prime/text-to-video` | Vídeo | video | 19.04 cr (US$ 1.19) |
| Wan 3.0 — Image to video | `alibaba/wan-3.0/image-to-video` | Vídeo | video | variável (ver detalhe) |
| Wan 3.0 — Reference to video | `alibaba/wan-3.0/reference-to-video` | Vídeo | video | variável (ver detalhe) |
| Wan 3.0 — Text to video | `alibaba/wan-3.0/text-to-video` | Vídeo | video | variável (ver detalhe) |
| Seedance 2.0 — Image to video | `bytedance/seedance-2.0/image-to-video` | Vídeo | video | variável (ver detalhe) |
| Seedance 2.0 — Reference to video | `bytedance/seedance-2.0/reference-to-video` | Vídeo, Vídeo (edição) | video | n/d |
| Seedance 2.0 — Text to video | `bytedance/seedance-2.0/text-to-video` | Vídeo | video | variável (ver detalhe) |
| Seedance 2.5 — Image to video | `bytedance/seedance-2.5/image-to-video` | Vídeo | video | variável (ver detalhe) |
| Seedance 2.5 — Reference to video | `bytedance/seedance-2.5/reference-to-video` | Vídeo, Vídeo (edição) | video | n/d |
| Seedance 2.5 — Text to video | `bytedance/seedance-2.5/text-to-video` | Vídeo | video | variável (ver detalhe) |
| Seedance 2.5 — Video edit | `bytedance/seedance-2.5/video-edit` | Vídeo (edição) | video | variável (ver detalhe) |
| Seedance 2.5 — Video extend | `bytedance/seedance-2.5/video-extend` | Vídeo (edição) | video | variável (ver detalhe) |
| SOUL — Text to image | `higgsfield-ai/soul/standard` | Imagem | image | 1.5 cr (US$ 0.094) |
| Soul 2 | `higgsfield-ai/soul/v2/image-to-image` | Edição de imagem | image | sem schema público |
| SOUL V2 — Text to image | `higgsfield-ai/soul/v2/standard` | Imagem | image | 0.05 cr (US$ 0.004) |
| Ads Studio — Generate ads | `higgsfield/ads-studio/v1.0` | Imagem | image | variável (ver detalhe) |
| AI Influencer | `higgsfield/ai-influencer` | Edição de imagem, Imagem | image | sem schema público |
| Cinema Studio 4.0 — Generate | `higgsfield/cinema-studio/4.0` | Vídeo (edição) | video | variável (ver detalhe) |
| Genjutsu — Motion transfer | `higgsfield/genjutsu/motion-transfer/v1.0` | Vídeo (edição) | video | variável (ver detalhe) |
| Genjutsu — Object swap | `higgsfield/genjutsu/object-swap/v1.0` | Vídeo (edição) | video | variável (ver detalhe) |
| Genjutsu — Restyle | `higgsfield/genjutsu/restyle/v1.0` | Vídeo (edição) | video | variável (ver detalhe) |
| Ideogram 4.0 — Generate | `ideogram/v4.0` | Edição de imagem, Imagem | image | 0.96 cr (US$ 0.06) |
| Kling 2.6 Motion Control — Pro | `kling-video/motion-control/pro` | Vídeo | video | n/d |
| Kling 2.6 Motion Control — Standard | `kling-video/motion-control/std` | Vídeo | video | n/d |
| Kling O3 — First last frame | `kling-video/o3/first-last-frame` | Vídeo | video | 7.616 cr (US$ 0.476) |
| Kling O3 — Image reference | `kling-video/o3/image-reference` | Vídeo | video | 5.712 cr (US$ 0.357) |
| Kling O3 — Video edit | `kling-video/o3/video-edit` | Vídeo | video | n/d |
| Kling O3 — Video reference | `kling-video/o3/video-reference` | Vídeo | video | 11.424 cr (US$ 0.714) |
| Kling Omni — First last frame | `kling-video/omni/first-last-frame` | Vídeo | video | 7.616 cr (US$ 0.476) |
| Kling Omni — Image reference | `kling-video/omni/image-reference` | Vídeo | video | 7.616 cr (US$ 0.476) |
| Kling Omni — Video edit | `kling-video/omni/video-edit` | Vídeo | video | n/d |
| Kling Omni — Video reference | `kling-video/omni/video-reference` | Vídeo | video | 11.424 cr (US$ 0.714) |
| Kling 2.5 Turbo — Pro image to video | `kling-video/v2.5-turbo/pro/image-to-video` | Vídeo | video | 4.76 cr (US$ 0.298) |
| Kling 2.5 Turbo — Pro text to video | `kling-video/v2.5-turbo/pro/text-to-video` | Vídeo | video | 4.76 cr (US$ 0.298) |
| Kling 2.5 Turbo — Standard image to video | `kling-video/v2.5-turbo/standard/image-to-video` | Vídeo | video | 2.856 cr (US$ 0.179) |
| Kling 2.6 — Pro image to video | `kling-video/v2.6/pro/image-to-video` | Vídeo | video | 9.52 cr (US$ 0.595) |
| Kling 2.6 — Pro text to video | `kling-video/v2.6/pro/text-to-video` | Vídeo | video | 9.52 cr (US$ 0.595) |
| Kling 3.0 — Turbo · Image to video | `kling-video/v3.0-turbo/image-to-video` | Vídeo | video | 7.616 cr (US$ 0.476) |
| Kling 3.0 — Turbo · Text to video | `kling-video/v3.0-turbo/text-to-video` | Vídeo | video | 7.616 cr (US$ 0.476) |
| Kling 3.0 — 4K · Image to video | `kling-video/v3.0/4k/image-to-video` | Vídeo | video | 28.56 cr (US$ 1.785) |
| Kling 3.0 — 4K · Text to video | `kling-video/v3.0/4k/text-to-video` | Vídeo | video | 28.56 cr (US$ 1.785) |
| Kling 3.0 — Pro · Image to video | `kling-video/v3.0/pro/image-to-video` | Vídeo | video | 11.424 cr (US$ 0.714) |
| Kling 3.0 — Pro · Text to video | `kling-video/v3.0/pro/text-to-video` | Vídeo | video | 11.424 cr (US$ 0.714) |
| Kling 3.0 — Standard · Image to video | `kling-video/v3.0/std/image-to-video` | Vídeo | video | 8.568 cr (US$ 0.536) |
| Kling 3.0 — Standard · Text to video | `kling-video/v3.0/std/text-to-video` | Vídeo | video | 8.568 cr (US$ 0.536) |
| Kling 3.0 Motion Control — Pro | `kling-video/v3/motion-control/pro` | Vídeo | video | n/d |
| Kling 3.0 Motion Control — Standard | `kling-video/v3/motion-control/std` | Vídeo | video | n/d |
| LTX-2.5 — Image to video fast | `lightricks/ltx-2.5/image-to-video/fast` | Vídeo | video | 8.64 cr (US$ 0.54) |
| LTX-2.5 — Image to video pro | `lightricks/ltx-2.5/image-to-video/pro` | Vídeo | video | 11.52 cr (US$ 0.72) |
| LTX-2.5 — Text to video fast | `lightricks/ltx-2.5/text-to-video/fast` | Vídeo | video | 8.64 cr (US$ 0.54) |
| LTX-2.5 — Text to video pro | `lightricks/ltx-2.5/text-to-video/pro` | Vídeo | video | 11.52 cr (US$ 0.72) |
| Marketing Studio Image — 2.0 Alpha | `marketing-studio/image` | Edição de imagem, Imagem | image | 5.964 cr (US$ 0.373) |
| Marketing Studio Image — 2.5 Flare | `marketing-studio/image/flare` | Edição de imagem, Imagem | image | variável (ver detalhe) |
| Marketing Studio Image — 2.5 Sunburst | `marketing-studio/image/sunburst` | Edição de imagem, Imagem | image | variável (ver detalhe) |
| MiniMax H3 — Image to video | `minimax/h3/image-to-video` | Vídeo | video | 8.84 cr (US$ 0.553) |
| MiniMax H3 — Reference to video | `minimax/h3/reference-to-video` | Vídeo, Vídeo (edição) | video | n/d |
| MiniMax H3 — Text to video | `minimax/h3/text-to-video` | Vídeo | video | 8.84 cr (US$ 0.553) |
| Hailuo 2.3 — Standard image to video | `minimax/hailuo-2.3/standard/image-to-video` | Vídeo | video | 3.808 cr (US$ 0.238) |
| Hailuo 2.3 — Standard text to video | `minimax/hailuo-2.3/standard/text-to-video` | Vídeo | video | 3.808 cr (US$ 0.238) |
| PixVerse V6 — Image to video | `pixverse/v6/image-to-video` | Vídeo | video | 4.08 cr (US$ 0.255) |
| PixVerse V6 — Text to video | `pixverse/v6/text-to-video` | Vídeo | video | 4.08 cr (US$ 0.255) |
| Recraft V4.1 Pro — Text to image | `recraft/v4.1/pro/text-to-image` | Imagem | image | 3.36 cr (US$ 0.21) |
| Recraft V4.1 — Text to image | `recraft/v4.1/text-to-image` | Imagem | image | 0.56 cr (US$ 0.035) |
| Recraft V4.1 Utility Pro — Text to image | `recraft/v4.1/utility/pro/text-to-image` | Imagem | image | 3.36 cr (US$ 0.21) |
| Recraft V4.1 Utility — Text to image | `recraft/v4.1/utility/text-to-image` | Imagem | image | 0.56 cr (US$ 0.035) |
| Soul ID — Create character | `soul-id` | Personagem | image | 40 cr (US$ 2.5) |
| Wan 2.6 — Image to video | `wan/v2.6/image-to-video` | Vídeo | video | 6.8 cr (US$ 0.425) |
| Wan 2.6 — Reference to video | `wan/v2.6/reference-to-video` | Vídeo | video | 6.8 cr (US$ 0.425) |
| Wan 2.6 — Text to video | `wan/v2.6/text-to-video` | Vídeo | video | 6.8 cr (US$ 0.425) |
| Wan 2.7 — Image to video | `wan/v2.7/image-to-video` | Vídeo | video | 6.8 cr (US$ 0.425) |
| Wan 2.7 — Reference to video | `wan/v2.7/reference-to-video` | Vídeo | video | n/d |
| Wan 2.7 — Text to video | `wan/v2.7/text-to-video` | Vídeo | video | 6.8 cr (US$ 0.425) |
| Grok Image 2.0 — Generate and edit | `xai/grok-imagine-image-2.0` | Edição de imagem, Imagem | image | 0.96 cr (US$ 0.06) |
| Grok Imagine Video 1.5 — Reference to video | `xai/grok-imagine-video/v1.5/reference-to-video` | Vídeo, Vídeo | video | 6.4 cr (US$ 0.4) |
| Z-Image Turbo — Generate | `z-image/turbo` | Imagem | image | 0.24 cr (US$ 0.015) |

## Detalhe por modelo

### Happy Horse 1.0 — Image to video

- Slug: `alibaba/happy-horse/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/happy-horse-1/image-to-video
- Custo com padrões: **9.52 créditos** (US$ 0.595)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 1..2147483646 |  |
| `prompt` | string |  |  |
| `duration` | int | 2..15 | `5` |
| `image_url` * | string | uri |  |
| `resolution` | string | `720p`, `1080p` | `"720p"` |

Notas:
- The prompt is optional. This endpoint accepts one first-frame image; it does not support a last-frame image.

### Happy Horse 1.0 — Reference to video

- Slug: `alibaba/happy-horse/reference-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/happy-horse-1/reference-to-video
- Custo com padrões: **9.52 créditos** (US$ 0.595)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 1..2147483646 |  |
| `prompt` * | string |  |  |
| `duration` | int | 2..15 | `5` |
| `image_urls` * | array | itens uri |  |
| `resolution` | string | `720p`, `1080p` | `"720p"` |

Notas:
- Provide 1–9 reference images. This limit is enforced at submission even though the stored JSON Schema does not set minItems or maxItems. Reference videos are unsupported.

### Happy Horse 1.0 — Text to video

- Slug: `alibaba/happy-horse/text-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/happy-horse-1/text-to-video
- Custo com padrões: **9.52 créditos** (US$ 0.595)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 1..2147483646 |  |
| `prompt` * | string |  |  |
| `duration` | int | 3..15 | `5` |
| `resolution` | string | `720p`, `1080p` | `"720p"` |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1`, `4:3`, `3:4` | `"16:9"` |

Notas:
- The prompt must contain text; an empty string is rejected during submission.

### HappyHorse 1.1 — Image to video

- Slug: `alibaba/happy-horse/v1.1/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/happy-horse-1-1/image-to-video
- Custo com padrões: **12.24 créditos** (US$ 0.765)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 1..2147483646 |  |
| `prompt` | string |  |  |
| `duration` | int | 2..15 | `5` |
| `image_url` * | string | uri |  |
| `resolution` | string | `720p`, `1080p` | `"1080p"` |

Notas:
- The prompt is optional. This endpoint accepts one first-frame image; it does not support a last-frame image.

### HappyHorse 1.1 — Reference to video

- Slug: `alibaba/happy-horse/v1.1/reference-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/happy-horse-1-1/reference-to-video
- Custo com padrões: **12.24 créditos** (US$ 0.765)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 1..2147483646 |  |
| `prompt` * | string |  |  |
| `duration` | int | 2..15 | `5` |
| `image_urls` * | array | itens uri |  |
| `resolution` | string | `720p`, `1080p` | `"1080p"` |

Notas:
- Provide 1–9 reference images. This limit is enforced at submission even though the stored JSON Schema does not set minItems or maxItems. Reference videos are unsupported.

### HappyHorse 1.1 — Text to video

- Slug: `alibaba/happy-horse/v1.1/text-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/happy-horse-1-1/text-to-video
- Custo com padrões: **12.24 créditos** (US$ 0.765)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 1..2147483646 |  |
| `prompt` * | string |  |  |
| `duration` | int | 3..15 | `5` |
| `resolution` | string | `720p`, `1080p` | `"1080p"` |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1`, `4:3`, `3:4` | `"16:9"` |

Notas:
- The prompt must contain text; an empty string is rejected during submission.

### Qwen Image 3 — Edit images

- Slug: `alibaba/qwen-image-3/edit`
- Tipo: image_edit -> image
- Docs: https://docs.higgsfield.ai/docs/models/qwen-image-3/edit
- Custo com padrões: **0.64 créditos** (US$ 0.04)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 0..2147483647 |  |
| `prompt` * | string |  |  |
| `image_urls` * | array | 1-3 itens; itens uri |  |
| `resolution` | string | `1k`, `2k` | `"1k"` |
| `aspect_ratio` | string | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `7:9`, `9:7`, `9:16`, `16:9`, `21:9` | `"1:1"` |
| `prompt_extend` | bool |  | `true` |
| `enable_thinking` | bool |  | `true` |
| `negative_prompt` | string |  |  |
| `prompt_extend_mode` | string | `direct` | `"direct"` |

Notas:
- Provide 1–3 ordered reference image URLs. The list is required and cannot be empty.
- enable_thinking defaults to true and requires prompt_extend=true. Set both to false to disable enhancement.
- prompt_extend_mode accepts only direct; agent enhancement is unavailable on editing requests.
- prompt must contain non-whitespace text. The 2k square output tier maps to 1536 by 1536 pixels.

### Qwen Image 3 — Text to image

- Slug: `alibaba/qwen-image-3/text-to-image`
- Tipo: text2image -> image
- Docs: https://docs.higgsfield.ai/docs/models/qwen-image-3/text-to-image
- Custo com padrões: **0.64 créditos** (US$ 0.04)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 0..2147483647 |  |
| `prompt` * | string |  |  |
| `resolution` | string | `1k`, `2k` | `"1k"` |
| `aspect_ratio` | string | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `7:9`, `9:7`, `9:16`, `16:9`, `21:9` | `"1:1"` |
| `prompt_extend` | bool |  | `true` |
| `enable_thinking` | bool |  | `true` |
| `negative_prompt` | string |  |  |
| `prompt_extend_mode` | string | `direct`, `agent` | `"direct"` |

Notas:
- prompt must contain non-whitespace text. The schema imposes no character maximum; its 4,500-token guidance is advisory.
- enable_thinking defaults to true and requires prompt_extend=true. Set both to false to disable enhancement.
- prompt_extend_mode supports direct or agent. No reference images are accepted by this endpoint.
- resolution is a tier; 2k square maps to 1536 by 1536 pixels, not 2048 by 2048.

### Wan 3.0 Prime — Image to video

- Slug: `alibaba/wan-3.0-prime/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/wan-3-prime/image-to-video
- Custo com padrões: **19.04 créditos** (US$ 1.19)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 0..2147483647 |  |
| `prompt` * | string |  |  |
| `duration` | int | 2..30 | `5` |
| `image_url` * | string | uri |  |
| `resolution` | string | `480p`, `720p`, `1080p` | `"1080p"` |
| `aspect_ratio` | string | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `adaptive` | `"adaptive"` |
| `end_image_url` | string | uri |  |
| `generate_audio` | bool |  | `true` |
| `enable_thinking` | bool |  | `false` |

Notas:
- Use image_url for the first frame and optional end_image_url for the last frame. Reference arrays belong to the reference-to-video endpoint.
- The schema accepts seed=0, but the current implementation only forwards a nonzero seed.

### Wan 3.0 Prime — Reference to video

- Slug: `alibaba/wan-3.0-prime/reference-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/wan-3-prime/reference-to-video
- Custo com padrões: **19.04 créditos** (US$ 1.19)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 0..2147483647 |  |
| `prompt` * | string |  |  |
| `duration` | int | 2..30 | `5` |
| `file_url` | string | uri |  |
| `link_url` | string | uri |  |
| `audio_urls` | array | 0-5 itens; itens uri |  |
| `image_urls` | array | 0-10 itens; itens uri |  |
| `resolution` | string | `480p`, `720p`, `1080p` | `"1080p"` |
| `video_urls` | array | 0-5 itens; itens uri |  |
| `aspect_ratio` | string | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `adaptive` | `"adaptive"` |
| `generate_audio` | bool |  | `true` |
| `enable_thinking` | bool |  | `false` |

Notas:
- Reference media are optional in the stored schema: only prompt is required. The example includes an image to demonstrate reference mode.
- Send either file_url or link_url. A document or web-page reference automatically enables thinking; when both are sent, file_url takes precedence.
- Reference video clips must be 1–30 seconds each and total at most 30 seconds. Reference audio must be WAV or MP3 and total at most 30 seconds, as specified in the production schema.
- The schema accepts seed=0, but the current implementation only forwards a nonzero seed.

### Wan 3.0 Prime — Text to video

- Slug: `alibaba/wan-3.0-prime/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/wan-3-prime/text-to-video
- Custo com padrões: **19.04 créditos** (US$ 1.19)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 0..2147483647 |  |
| `prompt` * | string |  |  |
| `duration` | int | 2..30 | `5` |
| `resolution` | string | `480p`, `720p`, `1080p` | `"1080p"` |
| `aspect_ratio` | string | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `adaptive` | `"adaptive"` |
| `generate_audio` | bool |  | `true` |
| `enable_thinking` | bool |  | `false` |

Notas:
- This endpoint generates from text; use the separate image or reference endpoint for media inputs.
- The schema accepts seed=0, but the current implementation only forwards a nonzero seed.

### Wan 3.0 — Image to video

- Slug: `alibaba/wan-3.0/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/wan-3/image-to-video
- Custo: Priced per generated second by resolution: 480p $0.05, 720p $0.10, or 1080p $0.20. Rates shown are before any applicable customer discount.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 0..2147483647 |  |
| `prompt` * | string |  |  |
| `duration` | int | 2..30 | `5` |
| `image_url` * | string | uri |  |
| `resolution` | string | `480p`, `720p`, `1080p` | `"1080p"` |
| `aspect_ratio` | string | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `adaptive` | `"adaptive"` |
| `end_image_url` | string | uri |  |
| `generate_audio` | bool |  | `true` |
| `enable_thinking` | bool |  | `false` |

Notas:
- Use image_url for the first frame and optional end_image_url for the last frame. Reference arrays belong to the reference-to-video endpoint.
- The schema accepts seed=0, but the current implementation only forwards a nonzero seed.

### Wan 3.0 — Reference to video

- Slug: `alibaba/wan-3.0/reference-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/wan-3/reference-to-video
- Custo: Priced per generated second by resolution: 480p $0.05, 720p $0.10, or 1080p $0.20. Rates shown are before any applicable customer discount.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 0..2147483647 |  |
| `prompt` * | string |  |  |
| `duration` | int | 2..30 | `5` |
| `file_url` | string | uri |  |
| `link_url` | string | uri |  |
| `audio_urls` | array | 0-5 itens; itens uri |  |
| `image_urls` | array | 0-10 itens; itens uri |  |
| `resolution` | string | `480p`, `720p`, `1080p` | `"1080p"` |
| `video_urls` | array | 0-5 itens; itens uri |  |
| `aspect_ratio` | string | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `adaptive` | `"adaptive"` |
| `generate_audio` | bool |  | `true` |
| `enable_thinking` | bool |  | `false` |

Notas:
- Reference media are optional in the stored schema: only prompt is required. The example includes an image to demonstrate reference mode.
- Send either file_url or link_url. A document or web-page reference automatically enables thinking; when both are sent, file_url takes precedence.
- Reference video clips must be 1–30 seconds each and total at most 30 seconds. Reference audio must be WAV or MP3 and total at most 30 seconds, as specified in the production schema.
- The schema accepts seed=0, but the current implementation only forwards a nonzero seed.

### Wan 3.0 — Text to video

- Slug: `alibaba/wan-3.0/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/wan-3/text-to-video
- Custo: Priced per generated second by resolution: 480p $0.05, 720p $0.10, or 1080p $0.20. Rates shown are before any applicable customer discount.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 0..2147483647 |  |
| `prompt` * | string |  |  |
| `duration` | int | 2..30 | `5` |
| `resolution` | string | `480p`, `720p`, `1080p` | `"1080p"` |
| `aspect_ratio` | string | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `adaptive` | `"adaptive"` |
| `generate_audio` | bool |  | `true` |
| `enable_thinking` | bool |  | `false` |

Notas:
- This endpoint generates from text; use the separate image or reference endpoint for media inputs.
- The schema accepts seed=0, but the current implementation only forwards a nonzero seed.

### Seedance 2.0 — Image to video

- Slug: `bytedance/seedance-2.0/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/seedance-2/image-to-video
- Custo: Token-metered pricing. Billable video tokens = ceil(generated video seconds × output width × output height × 24 fps / 1024). Image and audio references do not count as video input. Per 1,000 video tokens: 480p/720p/1080p $0.014, 4K $0.008. Rates shown are before any applicable customer discount.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` | string |  |  |
| `duration` | int | 4..15 | `5` |
| `image_url` * | string | uri |  |
| `resolution` | string | `480p`, `720p`, `1080p`, `4k` | `"720p"` |
| `end_image_url` | string | uri |  |
| `generate_audio` | bool |  | `true` |

Notas:
- Use publicly accessible media URLs; asset:// references are rejected for these endpoints.
- The prompt is optional. Output framing follows image_url; end_image_url is the optional last frame.

### Seedance 2.0 — Reference to video

- Slug: `bytedance/seedance-2.0/reference-to-video`
- Tipo: image2video, video2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/seedance-2/reference-to-video

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` | string |  |  |
| `duration` | int | 4..15 | `5` |
| `audio_urls` | array | 1-3 itens; itens uri |  |
| `image_urls` | array | 1-9 itens; itens uri |  |
| `resolution` | string | `480p`, `720p`, `1080p`, `4k` | `"720p"` |
| `video_urls` | array | 1-3 itens; itens uri |  |
| `aspect_ratio` | string | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9` | `"16:9"` |
| `generate_audio` | bool |  | `true` |

Notas:
- Use publicly accessible media URLs; asset:// references are rejected for these endpoints.
- Provide a nonempty image_urls or video_urls array. Audio alone does not satisfy the reference requirement. Do not mix reference arrays with image_url, end_image_url or video_url.
- Reference videos may be resized, transcoded and trimmed to 15 seconds each. Reference audio is normalized to 2–15 seconds per file and at most 15 seconds total.

### Seedance 2.0 — Text to video

- Slug: `bytedance/seedance-2.0/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/seedance-2/text-to-video
- Custo: Token-metered pricing. Billable video tokens = ceil(generated video seconds × output width × output height × 24 fps / 1024). Image and audio references do not count as video input. Per 1,000 video tokens: 480p/720p/1080p $0.014, 4K $0.008. Rates shown are before any applicable customer discount.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | 4..15 | `5` |
| `resolution` | string | `480p`, `720p`, `1080p`, `4k` | `"720p"` |
| `aspect_ratio` | string | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9` | `"16:9"` |
| `generate_audio` | bool |  | `true` |

Notas:
- Use publicly accessible media URLs; asset:// references are rejected for these endpoints.
- Provide a nonblank prompt. This endpoint does not use media inputs; use the image-to-video or reference-to-video endpoint instead.

### Seedance 2.5 — Image to video

- Slug: `bytedance/seedance-2.5/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/seedance-2-5/image-to-video
- Custo: For 16:9 video without video input, your request costs roughly $0.2056 per second of generated video at 480p, $0.4622 at 720p, and $1.1372 at 1080p. Each 1,000 video tokens costs $0.0214 at 480p or 720p and $0.0234 at 1080p. Billable video tokens = ceil(output height × output width × (input video duration + generated video duration) × 24 / 1024). Image and audio references do not count as video input. Actual pricing depends on output dimensions and billable duration. Rates shown are before any applicable customer discount.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` | string |  |  |
| `duration` | int | 4..30 | `5` |
| `image_url` * | string | uri |  |
| `resolution` | string | `480p`, `720p`, `1080p` | `"720p"` |
| `bitrate_mode` | string | `standard`, `high` | `"high"` |
| `end_image_url` | string | uri |  |
| `generate_audio` | bool |  | `true` |

Notas:
- Use publicly accessible media URLs; asset:// references are rejected for these endpoints.
- The prompt is optional. Output framing follows image_url; end_image_url is the optional last frame.

### Seedance 2.5 — Reference to video

- Slug: `bytedance/seedance-2.5/reference-to-video`
- Tipo: image2video, video2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/seedance-2-5/reference-to-video

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` | string |  |  |
| `duration` | int | 4..30 | `5` |
| `audio_urls` | array | 1-10 itens; itens uri |  |
| `image_urls` | array | 1-30 itens; itens uri |  |
| `resolution` | string | `480p`, `720p`, `1080p` | `"720p"` |
| `video_urls` | array | 1-10 itens; itens uri |  |
| `aspect_ratio` | string | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9` | `"16:9"` |
| `bitrate_mode` | string | `standard`, `high` | `"high"` |
| `generate_audio` | bool |  | `true` |

Notas:
- Use publicly accessible media URLs; asset:// references are rejected for these endpoints.
- Provide at least one nonempty reference array: image_urls, video_urls or audio_urls. Audio-only references are supported by this schema and preprocessing path.
- Reference media are limited to 30 images, 10 videos and 10 audio files, with at most 50 items total. Video duration and audio duration are normalized separately to at most 30 seconds total per media type.

### Seedance 2.5 — Text to video

- Slug: `bytedance/seedance-2.5/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/seedance-2-5/text-to-video
- Custo: For 16:9 video without video input, your request costs roughly $0.2056 per second of generated video at 480p, $0.4622 at 720p, and $1.1372 at 1080p. Each 1,000 video tokens costs $0.0214 at 480p or 720p and $0.0234 at 1080p. Billable video tokens = ceil(output height × output width × (input video duration + generated video duration) × 24 / 1024). Image and audio references do not count as video input. Actual pricing depends on output dimensions and billable duration. Rates shown are before any applicable customer discount.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | 4..30 | `5` |
| `resolution` | string | `480p`, `720p`, `1080p` | `"720p"` |
| `aspect_ratio` | string | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9` | `"16:9"` |
| `bitrate_mode` | string | `standard`, `high` | `"high"` |
| `output_format` | string | `mp4`, `mov` | `"mp4"` |
| `generate_audio` | bool |  | `true` |

Notas:
- Use publicly accessible media URLs; asset:// references are rejected for these endpoints.
- Provide a nonblank prompt. This endpoint does not use media inputs; use the image-to-video or reference-to-video endpoint instead.

### Seedance 2.5 — Video edit

- Slug: `bytedance/seedance-2.5/video-edit`
- Tipo: video2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/seedance-2-5/video-edit
- Custo: Video input is required. Each 1,000 video tokens costs $0.01284 at 480p or 720p and $0.01404 at 1080p (0.6× the no-video-input rate). For 16:9 output, this is roughly $0.1234 at 480p, $0.2773 at 720p, and $0.6823 at 1080p per second of combined input and generated video duration. Both input and generated video durations are billable. Billable video tokens = ceil(output height × output width × (input video duration + generated video duration) × 24 / 1024). Image and audio references do not count as video input. Actual pricing depends on output dimensions and billable duration. Rates shown are before any applicable customer discount.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `video_url` * | string | uri |  |
| `audio_urls` | array | 1-10 itens; itens uri |  |
| `image_urls` | array | 1-30 itens; itens uri |  |
| `resolution` | string | `480p`, `720p`, `1080p` | `"720p"` |
| `video_urls` | array | 1-10 itens; itens uri |  |
| `bitrate_mode` | string | `standard`, `high` | `"high"` |
| `generate_audio` | bool |  | `true` |

Notas:
- Use publicly accessible media URLs; asset:// references are rejected for these endpoints.
- The source video_url counts toward the 10-video limit, so include at most 9 additional video_urls. At most 50 media items are accepted across the source video and all reference arrays.
- Videos and audio may be trimmed or padded during preprocessing to fit their respective 30-second total budgets. Output framing follows the source video.
- Do not send duration: this endpoint derives output duration from the processed source video. The main video is normalized to at least 4 seconds.

### Seedance 2.5 — Video extend

- Slug: `bytedance/seedance-2.5/video-extend`
- Tipo: video2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/seedance-2-5/video-extend
- Custo: Video input is required. Each 1,000 video tokens costs $0.01284 at 480p or 720p and $0.01404 at 1080p (0.6× the no-video-input rate). For 16:9 output, this is roughly $0.1234 at 480p, $0.2773 at 720p, and $0.6823 at 1080p per second of combined input and generated video duration. Both input and generated video durations are billable. Billable video tokens = ceil(output height × output width × (input video duration + generated video duration) × 24 / 1024). Image and audio references do not count as video input. Actual pricing depends on output dimensions and billable duration. Rates shown are before any applicable customer discount.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | 4..30 | `5` |
| `video_url` * | string | uri |  |
| `audio_urls` | array | 1-10 itens; itens uri |  |
| `image_urls` | array | 1-30 itens; itens uri |  |
| `resolution` | string | `480p`, `720p`, `1080p` | `"720p"` |
| `video_urls` | array | 1-10 itens; itens uri |  |
| `bitrate_mode` | string | `standard`, `high` | `"high"` |
| `generate_audio` | bool |  | `true` |

Notas:
- Use publicly accessible media URLs; asset:// references are rejected for these endpoints.
- The source video_url counts toward the 10-video limit, so include at most 9 additional video_urls. At most 50 media items are accepted across the source video and all reference arrays.
- Videos and audio may be trimmed or padded during preprocessing to fit their respective 30-second total budgets. Output framing follows the source video.
- duration is an integer from 4 to 30 seconds, with default 5.

### SOUL — Text to image

- Slug: `higgsfield-ai/soul/standard`
- Tipo: text2image -> image
- Docs: https://docs.higgsfield.ai/docs/models/soul-standard/generate
- Custo com padrões: **1.5 créditos** (US$ 0.094)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `aspect_ratio` | string | `9:16`, `16:9`, `4:3`, `3:4`, `1:1`, `2:3`, `3:2` | `"4:3"` |
| `enhance_prompt` | bool |  | `false` |
| `style_id` | string | uuid | `"464ea177-8d40-4940-8d9d-b438bab269c7"` |
| `style_strength` | number | 0..1 | `1` |
| `resolution` | string | `720p`, `1080p` | `"720p"` |
| `seed` | int \| null |  | `null` |
| `custom_reference_id` | string \| null |  | `null` |
| `custom_reference_strength` | number | 0..1 | `1` |
| `image_reference_url` | string \| null |  | `null` |
| `batch_size` | int | `1`, `4` | `1` |

Notas:
- batch_size is 1 or 4 only. A custom_reference_id must belong to the calling account and have completed training.
- aspect_ratio defaults to 4:3; enhance_prompt defaults to false; style_id defaults to 464ea177-8d40-4940-8d9d-b438bab269c7.
- Optional image_reference_url guides prompt enhancement; it is distinct from custom_reference_id for a trained character.
- seed may be omitted or null; generation selects a random seed when it is absent.
- Short prompts using the general style can be enhanced automatically even when enhance_prompt=false.
- custom_reference_strength=0 uses the selected style's default character strength; it does not disable the character reference.

### Soul 2

- Slug: `higgsfield-ai/soul/v2/image-to-image`
- Tipo: image_edit -> image
- **Sem schema público na documentação**: não exposto no app.

### SOUL V2 — Text to image

- Slug: `higgsfield-ai/soul/v2/standard`
- Tipo: text2image -> image
- Docs: https://docs.higgsfield.ai/docs/models/soul-2/generate
- Custo com padrões: **0.05 créditos** (US$ 0.004)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `aspect_ratio` | string | `9:16`, `16:9`, `4:3`, `3:4`, `1:1`, `2:3`, `3:2` | `"1:1"` |
| `resolution` | string | `720p`, `1080p` | `"720p"` |
| `enhance_prompt` | bool |  | `false` |
| `custom_reference_id` | string \| null |  | `null` |
| `custom_reference_strength` | number | 0..1 | `1` |
| `style_id` | string | uuid | `"3db34ab5-3439-4317-9e03-08dc30852e69"` |
| `style_strength` | number | 0..1 | `1` |
| `seed` | int | 1..1000000 |  |
| `batch_size` | int | `1`, `4` | `1` |

Notas:
- batch_size is 1 or 4 only. A custom_reference_id must belong to the calling account and have completed training.
- aspect_ratio defaults to 1:1 and enhance_prompt defaults to false. seed defaults to a random integer from 1 to 1000000; explicit null is invalid.
- style_id defaults to 3db34ab5-3439-4317-9e03-08dc30852e69. style_strength is accepted by the request schema but currently has no effect on generation.
- Short prompts using the general style can be enhanced automatically even when enhance_prompt=false.
- When using custom_reference_id, set custom_reference_strength to a value greater than 0 and no greater than 1. The schema accepts 0, but the current runtime fails to process it for a character reference.

### Ads Studio — Generate ads

- Slug: `higgsfield/ads-studio/v1.0`
- Tipo: text2image -> image
- Docs: https://docs.higgsfield.ai/docs/models/ads-studio/generate
- Custo: Per 1M tokens: text input $5, cached text input $1.25, text output $10; image input $8, cached image input $2, image output $30. Quality defaults to high. Final cost uses actual token usage and standard credit rounding. The initial charge is an estimate reconciled on completion.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `niche` | string | máx 1000 chars | `""` |
| `prompt` * | string | máx 8000 chars |  |
| `language` | string | máx 80 chars | `""` |
| `batch_size` | int | 1..8 | `1` |
| `image_urls` | array | 0-10 itens | `[]` |
| `aspect_ratio` | string | `1:1`, `4:5`, `5:4`, `16:9`, `9:16`, `4:3`, `3:4`, `21:9`, `3:2`, `2:3`, `2:1`, `1:2`, `3:1`, `1:3` | `"1:1"` |
| `target_audience` | string | máx 2000 chars | `""` |

Notas:
- Submit one request with your brief. Ad concepts are prepared automatically, then rendered as images; no separate preparation or generate call is required.
- batch_size selects 1–8 ad concepts. Each concept produces one image, so a fully successful batch returns batch_size images.
- Rendering uses GPT Image 2.5 Flare with fixed 2k resolution and high quality. Exact dimensions depend on aspect_ratio. quality, resolution, renderer and fallback model are not public inputs.
- All outputs in a batch use the requested aspect_ratio. Omitting it selects 1:1. The value auto is not supported.
- Set HF_API_KEY_ID and HF_API_KEY_SECRET to your API credentials. Set a unique IDEMPOTENCY_KEY for each intended generation; reuse it only when retrying that same request.

### AI Influencer

- Slug: `higgsfield/ai-influencer`
- Tipo: image_edit, text2image -> image (workflow)
- **Sem schema público na documentação**: não exposto no app.

### Cinema Studio 4.0 — Generate

- Slug: `higgsfield/cinema-studio/4.0`
- Tipo: video2video -> video (workflow)
- Docs: https://docs.higgsfield.ai/docs/models/cinema-studio-4/generate
- Custo: Token-metered pricing. Billable video tokens = ceil((input video seconds + generated video seconds) × output width × output height × 24 fps / 1024). Image and audio references do not count as video input. At 480p or 720p, each 1,000 video tokens cost $0.0214 without video input or $0.01284 with video input (0.6× the standard rate). With video references, both input and generated video durations are billable. Rates shown are before any applicable customer discount.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `era` | string | `1960s`, `1980s`, `1990s`, `2000s`, `2020s` |  |
| `genre` | string | `epic`, `drama`, `noir`, `comedy`, `horror`, `action` |  |
| `light` | string | `silhouette`, `practicals`, `window`, `overhead-fall`, `contre-jour`, `soft-cross` |  |
| `pacing` | string | `chaotic`, `dynamic`, `calm`, `single-shot` |  |
| `prompt` * | string |  |  |
| `duration` | int | 4..30 | `5` |
| `audio_urls` | array | 0-10 itens; itens uri |  |
| `image_urls` | array | 0-30 itens; itens uri |  |
| `resolution` | string | `480p`, `720p` | `"720p"` |
| `video_urls` | array | 0-10 itens; itens uri |  |
| `camera_lens` | string | `clean-sharp`, `anamorphic`, `vintage-anamorphic`, `warm-vintage`, `halation-vintage` |  |
| `aspect_ratio` | string | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9` | `"16:9"` |
| `camera_model` | string | `modern`, `35mm-film`, `8mm-film`, `dv-camcorder` |  |
| `color_palette` | string | `static-noon`, `twilight-fable`, `back-row-kissing-seats`, `on-the-other-side-of-the-porthole`, `the-emerald-ambush`, `highway-standoff`, `the-faded-fresco`, `oil-ochre`, `the-mountain-convent`, `ghost-in-the-code`, `pink-velvet`, `two-days-to-the-horizon`, `industrial-fog`, `stairs-go-up`, `field-post`, `home-is-the-next-gas-station`, `glossy-flesh`, `the-crimson-ballet`, `neon-rain-at-midnight`, `the-morning-after-rain`, `the-iron-borough`, `the-ground`, `the-investigation`, `turquoise-mirage`, `a-dream-in-color`, `breakfast-on-schedule`, `favela-gold`, `a-hotel-for-one`, `after-dark`, `crimson-vigi`, `the-neighbors-saw-everything`, `the-grey-channel`, `mirage-at-noon`, `bubblegum-boulevard`, `yellow-room`, `the-earth-keeps-things-reluctantly`, `tropic-fever-dream`, `bioluminescent-night`, `dont-turn-it-off-im-watching`, `the-silk-curtain-falls`, `the-butterfly`, `playtime`, `wallpaper-romance`, `overtime`, `the-way-home-is-longer`, `everyone-speaks-in-whispers`, `runaway-summer`, `amber-wasteland`, `the-circus`, `gasoline-sunset` |  |
| `generate_audio` | bool |  | `true` |
| `camera_aperture` | string | `f14-wide-open`, `f4-moderate`, `f11-deep-focus` |  |
| `camera_movement` | string | `snorricam`, `robot-arm`, `tilt-up`, `rack-focus`, `tilt-down`, `pov`, `pan-left`, `crane-up`, `pan-right`, `crane-down`, `side-tracking`, `pedestal-up`, `pedestal-down`, `handheld`, `tracking`, `drone-orbit`, `dolly-zoom`, `aerial-pullback`, `static-shot`, `bullet-time`, `whip-pan`, `slow-zoom-in`, `arc-left`, `slow-zoom-out`, `arc-right`, `truck-right`, `dolly-in`, `truck-left`, `dolly-out`, `slider-right`, `crush-zoom`, `slider-left`, `helicopter-shot` |  |

Notas:
- This is the public Cinema Studio 4.0 workflow. It uses text-to-video when references are absent and reference-to-video when any media array is nonempty.
- Omit creative-control fields to let the director choose them automatically; the literal value "auto" is not accepted for these enum fields.
- Optional prompt references use one-based tokens such as <<<image_1>>>, <<<video_1>>> and <<<audio_1>>>. Each token must refer to an attached item of the same media type.
- This endpoint produces a new video. Editing and extension use the separate Seedance 2.5 endpoints.
- Reference media are limited to 30 images, 10 videos and 10 audio files, with at most 50 items total. Video and audio may be normalized to separate 30-second total budgets.

### Genjutsu — Motion transfer

- Slug: `higgsfield/genjutsu/motion-transfer/v1.0`
- Tipo: video2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/genjutsu/motion-transfer
- Custo: Per-second pricing. Each second of input video costs $0.318 at 480p, $0.681 at 720p, $1.632 at 1080p. Input duration is rounded up to the nearest whole second. Rates shown are before any applicable customer discount.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` | string | máx 10000 chars | `""` |
| `video_url` * | string | máx 2083 chars; uri |  |
| `image_urls` * | array | 1-8 itens; itens uri |  |
| `resolution` | string | `720p`, `480p`, `1080p` | `"720p"` |

Notas:
- Use higgsfield/genjutsu/motion-transfer/v1.0 for new integrations. The legacy endpoint higgsfiled/genjutsu/motion-transfer/v1.0 remains callable for existing clients but is hidden from model discovery.
- The source video must be at least 4 seconds. Videos longer than 30 seconds are trimmed to 30 seconds; output duration follows the prepared source video.
- Provide 1–8 image references. The prompt is optional and defaults to an empty string.

### Genjutsu — Object swap

- Slug: `higgsfield/genjutsu/object-swap/v1.0`
- Tipo: video2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/genjutsu/object-swap
- Custo: Per-second pricing. Each second of input video costs $0.318 at 480p, $0.681 at 720p, $1.632 at 1080p. Input duration is rounded up to the nearest whole second. Rates shown are before any applicable customer discount.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` | string | máx 10000 chars | `""` |
| `video_url` * | string | máx 2083 chars; uri |  |
| `image_urls` * | array | 1-8 itens; itens uri |  |
| `resolution` | string | `720p`, `480p`, `1080p` | `"720p"` |

Notas:
- Use higgsfield/genjutsu/object-swap/v1.0 for new integrations. The legacy endpoint higgsfiled/genjutsu/object-swap/v1.0 remains callable for existing clients but is hidden from model discovery.
- The source video must be at least 4 seconds. Videos longer than 30 seconds are trimmed to 30 seconds; output duration follows the prepared source video.
- Provide 1–8 image references. The prompt is optional and defaults to an empty string.
- The source video must contain at least 409,600 pixels per frame (width × height).

### Genjutsu — Restyle

- Slug: `higgsfield/genjutsu/restyle/v1.0`
- Tipo: video2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/genjutsu/restyle
- Custo: Roughly costs $0.318 per second at 480p, $0.681 per second at 720p, or $1.632 per second at 1080p.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` | string | máx 10000 chars | `""` |
| `preset_id` * | string | uuid |  |
| `video_url` * | string | uri |  |
| `image_urls` | array | 0-5 itens; itens uri | `[]` |
| `resolution` | string | `480p`, `720p`, `1080p` | `"720p"` |

Notas:
- Restyle changes the visual style of a source video while retaining its motion, shot composition, and source audio. Each request produces one video.
- Select a current style from GET /models/higgsfield/genjutsu/restyle/v1.0/presets and send its UUID as preset_id. The example UUID below is illustrative of a published preset; fetch the current catalog before submitting.
- The source must be at least 4 seconds and no larger than 200 MiB. Videos longer than 30 seconds are trimmed to their first 30 seconds, including audio.
- Character references are optional: omit image_urls or send [] to restyle the existing source subjects. Supply up to 5 character images to guide their appearance.
- Defaults apply to omitted optional fields. Use [] or an empty string where appropriate; null is not accepted.
- Output framing is derived from the source and animation cadence can depend on the selected style. Exact output duration and FPS may differ from the source.

### Ideogram 4.0 — Generate

- Slug: `ideogram/v4.0`
- Tipo: image_edit, text2image -> image
- Docs: https://docs.higgsfield.ai/docs/models/ideogram-4/generate
- Custo com padrões: **0.96 créditos** (US$ 0.06)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string | máx 2048 chars |  |
| `image_url` | string | uri |  |
| `aspect_ratio` | string | `1:1`, `1:2`, `2:1`, `2:3`, `3:2`, `4:5`, `5:4`, `9:16`, `16:9`, `5:8`, `8:5`, `3:4`, `4:3`, `9:22`, `22:9`, `9:23`, `23:9`, `3:8`, `8:3`, `5:12`, `12:5`, `1:3`, `3:1` | `"1:1"` |
| `image_weight` | int | 1..100 |  |
| `rendering_speed` | string | `TURBO`, `DEFAULT`, `QUALITY` | `"DEFAULT"` |

Notas:
- Omit image_url for text-to-image; provide image_url for remix/editing.
- image_weight controls preservation of the input image and applies to editing requests only; values are integers from 1 to 100.
- The square 1:1 aspect ratio is applied by default, including when an input image is supplied.
- rendering_speed values are case-sensitive: TURBO, DEFAULT, QUALITY. prompt must contain 2–2048 characters.

### Kling 2.6 Motion Control — Pro

- Slug: `kling-video/motion-control/pro`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-2-6-motion-control/pro

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` | string |  | `""` |
| `image_url` * | string | uri |  |
| `video_url` * | string | uri |  |
| `keep_original_sound` | string | `yes`, `no` | `"yes"` |
| `character_orientation` | string | `image`, `video` | `"video"` |

Notas:
- Use a motion-reference video from 3 to 30 seconds long. The output duration follows the source video; do not send a separate duration field.
- Use a character image up to 10 MB with each dimension between 300 and 65,536 pixels. Images outside the 0.4–2.5 width-to-height range are adjusted before generation.
- Videos larger than 100 MB are compressed before generation.
- Set character_orientation to image or video. keep_original_sound uses the strings yes and no, with yes as the default.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling 2.6 Motion Control — Standard

- Slug: `kling-video/motion-control/std`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-2-6-motion-control/std

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` | string |  | `""` |
| `image_url` * | string | uri |  |
| `video_url` * | string | uri |  |
| `keep_original_sound` | string | `yes`, `no` | `"yes"` |
| `character_orientation` | string | `image`, `video` | `"video"` |

Notas:
- Use a motion-reference video from 3 to 30 seconds long. The output duration follows the source video; do not send a separate duration field.
- Use a character image up to 10 MB with each dimension between 300 and 65,536 pixels. Images outside the 0.4–2.5 width-to-height range are adjusted before generation.
- Videos larger than 100 MB are compressed before generation.
- Set character_orientation to image or video. keep_original_sound uses the strings yes and no, with yes as the default.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling O3 — First last frame

- Slug: `kling-video/o3/first-last-frame`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-o3/first-last-frame
- Custo com padrões: **7.616 créditos** (US$ 0.476)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `mode` | string | `std`, `pro`, `4k` | `"pro"` |
| `sound` | string | `on`, `off` | `"off"` |
| `prompt` | string |  |  |
| `duration` | int | 3..15 | `5` |
| `multi_shots` | bool |  | `false` |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1` |  |
| `multi_prompt` | array | 1-6 itens |  |
| `last_frame_url` | string | uri |  |
| `first_frame_url` | string | uri |  |

Notas:
- first_frame_url supplies the starting frame; last_frame_url is optional. These names differ from the image_url and last_image_url fields on Kling 3.0 image-to-video.
- For a single shot, set multi_shots to false and provide prompt. For multiple shots, set multi_shots to true and provide 1–6 multi_prompt objects, each containing prompt and a positive integer duration.
- Always include a non-empty top-level prompt, including when using multi_prompt.
- Each shot prompt is limited to 512 characters. Custom-shot durations are summed for generation and billing; the top-level duration does not override that sum.
- Native audio uses sound: on or off and defaults to off.
- Keep the top-level prompt within 2,500 characters; longer prompts are truncated.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling O3 — Image reference

- Slug: `kling-video/o3/image-reference`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-o3/image-reference
- Custo com padrões: **5.712 créditos** (US$ 0.357)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `mode` | string | `std`, `pro`, `4k` | `"std"` |
| `sound` | string | `on`, `off` | `"off"` |
| `prompt` | string |  |  |
| `duration` | int | 3..15 | `5` |
| `elements` | array |  |  |
| `shot_type` | string | `customize`, `intelligent` | `"customize"` |
| `image_urls` | array | itens uri |  |
| `multi_shots` | bool |  | `false` |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1` |  |
| `multi_prompt` | array | 1-6 itens |  |
| `last_frame_url` | string | uri |  |
| `first_frame_url` | string | uri |  |

Notas:
- Supply image_urls for visual references. Reference images are optional in the schema.
- For a single shot, set multi_shots to false and provide prompt. For multiple shots, set multi_shots to true and provide 1–6 multi_prompt objects, each containing prompt and a positive integer duration.
- Always include a non-empty top-level prompt, including when using multi_prompt.
- Each shot prompt is limited to 512 characters. Custom-shot durations are summed for generation and billing; the top-level duration does not override that sum.
- Native audio uses sound: on or off and defaults to off.
- A multi_prompt shot must last at least 1 second; zero-second shots are rejected even though the schema permits zero.
- When multi_shots is true, multi_prompt is required even with shot_type set to intelligent.
- Keep the top-level prompt within 2,500 characters; longer prompts are truncated.
- elements contains Kling element IDs as decimal strings. Each ID must belong to the account making the request; arbitrary provider IDs are rejected.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling O3 — Video edit

- Slug: `kling-video/o3/video-edit`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-o3/video-edit

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `mode` | string | `std`, `pro`, `4k` | `"pro"` |
| `prompt` * | string |  |  |
| `elements` | array | 0-4 itens |  |
| `image_urls` | array | 0-4 itens; itens uri |  |
| `video_urls` * | array | 1-1 itens; itens uri |  |

Notas:
- Supply exactly one source video from 3 to 15.5 seconds long and no larger than 200 MB. Duration is derived from the video; do not send a separate duration field.
- You may also supply up to four image_urls and up to four elements.
- Keep the top-level prompt within 2,500 characters; longer prompts are truncated.
- elements contains Kling element IDs as decimal strings. Each ID must belong to the account making the request; arbitrary provider IDs are rejected.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling O3 — Video reference

- Slug: `kling-video/o3/video-reference`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-o3/video-reference
- Custo com padrões: **11.424 créditos** (US$ 0.714)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `mode` | string | `std`, `pro` | `"pro"` |
| `prompt` * | string |  |  |
| `duration` | int | 3..10 | `5` |
| `elements` | array | 0-4 itens |  |
| `image_urls` | array | 0-4 itens; itens uri |  |
| `video_urls` * | array | 1-1 itens; itens uri |  |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1` |  |

Notas:
- Supply exactly one video reference. duration controls the generated clip and accepts integer values from 3 to 10 seconds.
- You may also supply up to four image_urls and up to four elements.
- Keep the top-level prompt within 2,500 characters; longer prompts are truncated.
- elements contains Kling element IDs as decimal strings. Each ID must belong to the account making the request; arbitrary provider IDs are rejected.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling Omni — First last frame

- Slug: `kling-video/omni/first-last-frame`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-omni/first-last-frame
- Custo com padrões: **7.616 créditos** (US$ 0.476)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `mode` | string | `std`, `pro` | `"pro"` |
| `prompt` * | string |  |  |
| `duration` | int | `5`, `10` | `5` |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1` | `"16:9"` |
| `last_frame_url` | string | uri |  |
| `first_frame_url` * | string | uri |  |

Notas:
- first_frame_url supplies the starting frame; last_frame_url is optional. These names differ from the image_url and last_image_url fields on Kling 3.0 image-to-video.
- Keep the top-level prompt within 2,500 characters; longer prompts are truncated.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling Omni — Image reference

- Slug: `kling-video/omni/image-reference`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-omni/image-reference
- Custo com padrões: **7.616 créditos** (US$ 0.476)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `mode` | string | `std`, `pro` | `"pro"` |
| `prompt` * | string |  |  |
| `duration` | int | 3..10 | `5` |
| `elements` | array |  |  |
| `image_urls` | array | itens uri |  |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1` | `"16:9"` |

Notas:
- Supply image_urls for visual references. Reference images are optional in the schema.
- Keep the top-level prompt within 2,500 characters; longer prompts are truncated.
- elements contains Kling element IDs as decimal strings. Each ID must belong to the account making the request; arbitrary provider IDs are rejected.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling Omni — Video edit

- Slug: `kling-video/omni/video-edit`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-omni/video-edit

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `mode` | string | `std`, `pro` | `"pro"` |
| `prompt` * | string |  |  |
| `elements` | array | 0-4 itens |  |
| `image_urls` | array | 0-4 itens; itens uri |  |
| `video_urls` * | array | 1-1 itens; itens uri |  |

Notas:
- Supply exactly one source video from 3 to 10 seconds long and no larger than 200 MB. Duration is derived from the video; do not send a separate duration field.
- You may also supply up to four image_urls and up to four elements.
- Keep the top-level prompt within 2,500 characters; longer prompts are truncated.
- elements contains Kling element IDs as decimal strings. Each ID must belong to the account making the request; arbitrary provider IDs are rejected.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling Omni — Video reference

- Slug: `kling-video/omni/video-reference`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-omni/video-reference
- Custo com padrões: **11.424 créditos** (US$ 0.714)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `mode` | string | `std`, `pro` | `"pro"` |
| `prompt` * | string |  |  |
| `duration` | int | 3..10 | `5` |
| `elements` | array | 0-4 itens |  |
| `image_urls` | array | 0-4 itens; itens uri |  |
| `video_urls` * | array | 1-1 itens; itens uri |  |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1` | `"16:9"` |

Notas:
- Supply exactly one video reference. duration controls the generated clip and accepts integer values from 3 to 10 seconds.
- You may also supply up to four image_urls and up to four elements.
- Keep the top-level prompt within 2,500 characters; longer prompts are truncated.
- elements contains Kling element IDs as decimal strings. Each ID must belong to the account making the request; arbitrary provider IDs are rejected.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling 2.5 Turbo — Pro image to video

- Slug: `kling-video/v2.5-turbo/pro/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-2-5-turbo/pro-image-to-video
- Custo com padrões: **4.76 créditos** (US$ 0.298)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | `5`, `10` | `5` |
| `cfg_scale` | number | 0..1 | `0.5` |
| `image_url` * | string | uri |  |
| `negative_prompt` | string |  | `""` |

Notas:
- duration accepts 5 or 10 seconds; 5 is the default.
- This endpoint does not expose a sound or aspect_ratio field.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling 2.5 Turbo — Pro text to video

- Slug: `kling-video/v2.5-turbo/pro/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-2-5-turbo/pro-text-to-video
- Custo com padrões: **4.76 créditos** (US$ 0.298)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | `5`, `10` | `5` |
| `cfg_scale` | number | 0..1 | `0.5` |
| `negative_prompt` | string |  | `""` |

Notas:
- duration accepts 5 or 10 seconds; 5 is the default.
- This endpoint does not expose a sound or aspect_ratio field.

### Kling 2.5 Turbo — Standard image to video

- Slug: `kling-video/v2.5-turbo/standard/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-2-5-turbo/standard-image-to-video
- Custo com padrões: **2.856 créditos** (US$ 0.179)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | `5`, `10` | `5` |
| `cfg_scale` | number | 0..1 | `0.5` |
| `image_url` * | string | uri |  |
| `negative_prompt` | string |  | `""` |

Notas:
- duration accepts 5 or 10 seconds; 5 is the default.
- This endpoint does not expose a sound or aspect_ratio field.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling 2.6 — Pro image to video

- Slug: `kling-video/v2.6/pro/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-2-6/pro-image-to-video
- Custo com padrões: **9.52 créditos** (US$ 0.595)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `sound` | string | `on`, `off` | `"on"` |
| `prompt` * | string |  |  |
| `duration` | int | `5`, `10` | `5` |
| `cfg_scale` | number | 0..1 | `0.5` |
| `image_url` * | string | uri |  |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1` |  |

Notas:
- duration accepts 5 or 10 seconds; 5 is the default.
- Native audio uses sound: on or off and defaults to on.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling 2.6 — Pro text to video

- Slug: `kling-video/v2.6/pro/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-2-6/pro-text-to-video
- Custo com padrões: **9.52 créditos** (US$ 0.595)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `sound` | string | `on`, `off` | `"on"` |
| `prompt` * | string |  |  |
| `duration` | int | `5`, `10` | `5` |
| `cfg_scale` | number | 0..1 | `0.5` |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1` | `"16:9"` |

Notas:
- duration accepts 5 or 10 seconds; 5 is the default.
- Native audio uses sound: on or off and defaults to on.

### Kling 3.0 — Turbo · Image to video

- Slug: `kling-video/v3.0-turbo/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-3/turbo-image-to-video
- Custo com padrões: **7.616 créditos** (US$ 0.476)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | 3..15 | `5` |
| `image_url` * | string | uri |  |
| `resolution` | string | `720p`, `1080p` | `"720p"` |

Notas:
- duration accepts integers from 3 to 15 seconds. resolution accepts 720p or 1080p and defaults to 720p.
- This endpoint has no sound, multi_shots, elements, or last-frame field.
- Keep prompt within 2,500 characters; longer prompts are truncated.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling 3.0 — Turbo · Text to video

- Slug: `kling-video/v3.0-turbo/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-3/turbo-text-to-video
- Custo com padrões: **7.616 créditos** (US$ 0.476)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | 3..15 | `5` |
| `resolution` | string | `720p`, `1080p` | `"720p"` |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1` | `"16:9"` |

Notas:
- duration accepts integers from 3 to 15 seconds. resolution accepts 720p or 1080p and defaults to 720p.
- This endpoint has no sound, multi_shots, elements, or last-frame field.
- aspect_ratio accepts 16:9, 9:16, or 1:1 and defaults to 16:9.
- Keep prompt within 3,072 characters; longer prompts are truncated.

### Kling 3.0 — 4K · Image to video

- Slug: `kling-video/v3.0/4k/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-3/4k-image-to-video
- Custo com padrões: **28.56 créditos** (US$ 1.785)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `sound` | string | `on`, `off` | `"on"` |
| `prompt` | string |  |  |
| `duration` | int | 3..15 | `5` |
| `elements` | array |  |  |
| `cfg_scale` | number | 0..1 | `0.5` |
| `image_url` * | string | uri |  |
| `multi_shots` | bool |  | `false` |
| `multi_prompt` | array | 0-6 itens |  |
| `last_image_url` | string | uri |  |

Notas:
- image_url is the first frame; last_image_url optionally sets the final frame.
- Always include a non-empty top-level prompt, including when using multi_prompt. Keep it within 2,500 characters; longer prompts are truncated.
- For custom shots, set multi_shots to true and provide 1–6 multi_prompt objects. Each object needs prompt (at most 512 characters) and duration (a positive integer from 1 to 15 seconds).
- Custom-shot durations are summed for generation and billing; the top-level duration does not override that sum. With multi_shots enabled and no custom shots, the top-level duration is retained.
- Native audio uses sound: on or off and defaults to on.
- elements contains Kling element IDs as decimal strings. Each ID must belong to the account making the request; arbitrary provider IDs are rejected.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling 3.0 — 4K · Text to video

- Slug: `kling-video/v3.0/4k/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-3/4k-text-to-video
- Custo com padrões: **28.56 créditos** (US$ 1.785)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `sound` | string | `on`, `off` | `"on"` |
| `prompt` | string |  |  |
| `duration` | int | 3..15 | `5` |
| `elements` | array |  |  |
| `cfg_scale` | number | 0..1 | `0.5` |
| `multi_shots` | bool |  | `false` |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1` | `"16:9"` |
| `multi_prompt` | array | 0-6 itens |  |

Notas:
- Always include a non-empty top-level prompt, including when using multi_prompt. Keep it within 2,500 characters; longer prompts are truncated.
- For custom shots, set multi_shots to true and provide 1–6 multi_prompt objects. Each object needs prompt (at most 512 characters) and duration (a positive integer from 1 to 15 seconds).
- Custom-shot durations are summed for generation and billing; the top-level duration does not override that sum. With multi_shots enabled and no custom shots, the top-level duration is retained.
- Native audio uses sound: on or off and defaults to on.
- elements contains Kling element IDs as decimal strings. Each ID must belong to the account making the request; arbitrary provider IDs are rejected.

### Kling 3.0 — Pro · Image to video

- Slug: `kling-video/v3.0/pro/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-3/pro-image-to-video
- Custo com padrões: **11.424 créditos** (US$ 0.714)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `sound` | string | `on`, `off` | `"on"` |
| `prompt` | string |  |  |
| `duration` | int | 3..15 | `5` |
| `elements` | array |  |  |
| `cfg_scale` | number | 0..1 | `0.5` |
| `image_url` * | string | uri |  |
| `multi_shots` | bool |  | `false` |
| `multi_prompt` | array | 0-6 itens |  |
| `last_image_url` | string | uri |  |

Notas:
- image_url is the first frame; last_image_url optionally sets the final frame.
- Always include a non-empty top-level prompt, including when using multi_prompt. Keep it within 2,500 characters; longer prompts are truncated.
- For custom shots, set multi_shots to true and provide 1–6 multi_prompt objects. Each object needs prompt (at most 512 characters) and duration (a positive integer from 1 to 15 seconds).
- Custom-shot durations are summed for generation and billing; the top-level duration does not override that sum. With multi_shots enabled and no custom shots, the top-level duration is retained.
- Native audio uses sound: on or off and defaults to on.
- elements contains Kling element IDs as decimal strings. Each ID must belong to the account making the request; arbitrary provider IDs are rejected.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling 3.0 — Pro · Text to video

- Slug: `kling-video/v3.0/pro/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-3/pro-text-to-video
- Custo com padrões: **11.424 créditos** (US$ 0.714)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `sound` | string | `on`, `off` | `"on"` |
| `prompt` | string |  |  |
| `duration` | int | 3..15 | `5` |
| `elements` | array |  |  |
| `cfg_scale` | number | 0..1 | `0.5` |
| `multi_shots` | bool |  | `false` |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1` | `"16:9"` |
| `multi_prompt` | array | 0-6 itens |  |

Notas:
- Always include a non-empty top-level prompt, including when using multi_prompt. Keep it within 2,500 characters; longer prompts are truncated.
- For custom shots, set multi_shots to true and provide 1–6 multi_prompt objects. Each object needs prompt (at most 512 characters) and duration (a positive integer from 1 to 15 seconds).
- Custom-shot durations are summed for generation and billing; the top-level duration does not override that sum. With multi_shots enabled and no custom shots, the top-level duration is retained.
- Native audio uses sound: on or off and defaults to on.
- elements contains Kling element IDs as decimal strings. Each ID must belong to the account making the request; arbitrary provider IDs are rejected.

### Kling 3.0 — Standard · Image to video

- Slug: `kling-video/v3.0/std/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-3/standard-image-to-video
- Custo com padrões: **8.568 créditos** (US$ 0.536)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `sound` | string | `on`, `off` | `"on"` |
| `prompt` | string |  |  |
| `duration` | int | 3..15 | `5` |
| `elements` | array |  |  |
| `cfg_scale` | number | 0..1 | `0.5` |
| `image_url` * | string | uri |  |
| `multi_shots` | bool |  | `false` |
| `multi_prompt` | array | 1-6 itens |  |
| `last_image_url` | string | uri |  |

Notas:
- image_url is the first frame; last_image_url optionally sets the final frame.
- Always include a non-empty top-level prompt, including when using multi_prompt. Keep it within 2,500 characters; longer prompts are truncated.
- For custom shots, set multi_shots to true and provide 1–6 multi_prompt objects. Each object needs prompt (at most 512 characters) and duration (a positive integer from 1 to 15 seconds).
- Custom-shot durations are summed for generation and billing; the top-level duration does not override that sum. With multi_shots enabled and no custom shots, the top-level duration is retained.
- Native audio uses sound: on or off and defaults to on.
- elements contains Kling element IDs as decimal strings. Each ID must belong to the account making the request; arbitrary provider IDs are rejected.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling 3.0 — Standard · Text to video

- Slug: `kling-video/v3.0/std/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-3/standard-text-to-video
- Custo com padrões: **8.568 créditos** (US$ 0.536)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `sound` | string | `on`, `off` | `"on"` |
| `prompt` | string |  |  |
| `duration` | int | 3..15 | `5` |
| `elements` | array |  |  |
| `cfg_scale` | number | 0..1 | `0.5` |
| `multi_shots` | bool |  | `false` |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1` | `"16:9"` |
| `multi_prompt` | array | 1-6 itens |  |

Notas:
- Always include a non-empty top-level prompt, including when using multi_prompt. Keep it within 2,500 characters; longer prompts are truncated.
- For custom shots, set multi_shots to true and provide 1–6 multi_prompt objects. Each object needs prompt (at most 512 characters) and duration (a positive integer from 1 to 15 seconds).
- Custom-shot durations are summed for generation and billing; the top-level duration does not override that sum. With multi_shots enabled and no custom shots, the top-level duration is retained.
- Native audio uses sound: on or off and defaults to on.
- elements contains Kling element IDs as decimal strings. Each ID must belong to the account making the request; arbitrary provider IDs are rejected.

### Kling 3.0 Motion Control — Pro

- Slug: `kling-video/v3/motion-control/pro`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-3-motion-control/pro

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` | string |  | `""` |
| `image_url` * | string | uri |  |
| `video_url` * | string | uri |  |
| `keep_original_sound` | string | `yes`, `no` | `"yes"` |
| `character_orientation` | string | `image`, `video` | `"video"` |

Notas:
- Use a motion-reference video from 3 to 30 seconds long. The output duration follows the source video; do not send a separate duration field.
- Use a character image up to 10 MB with each dimension between 300 and 65,536 pixels. Images outside the 0.4–2.5 width-to-height range are adjusted before generation.
- Videos larger than 100 MB are compressed before generation.
- Set character_orientation to image or video. keep_original_sound uses the strings yes and no, with yes as the default.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### Kling 3.0 Motion Control — Standard

- Slug: `kling-video/v3/motion-control/std`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/kling-3-motion-control/std

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` | string |  | `""` |
| `image_url` * | string | uri |  |
| `video_url` * | string | uri |  |
| `keep_original_sound` | string | `yes`, `no` | `"yes"` |
| `character_orientation` | string | `image`, `video` | `"video"` |

Notas:
- Use a motion-reference video from 3 to 30 seconds long. The output duration follows the source video; do not send a separate duration field.
- Use a character image up to 10 MB with each dimension between 300 and 65,536 pixels. Images outside the 0.4–2.5 width-to-height range are adjusted before generation.
- Videos larger than 100 MB are compressed before generation.
- Set character_orientation to image or video. keep_original_sound uses the strings yes and no, with yes as the default.
- The example.com media URLs are placeholders. Replace them with public HTTPS URLs to your own media before submitting.

### LTX-2.5 — Image to video fast

- Slug: `lightricks/ltx-2.5/image-to-video/fast`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/ltx-2-5/image-to-video-fast
- Custo com padrões: **8.64 créditos** (US$ 0.54)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `fps` | int | `24`, `25`, `48`, `50` | `25` |
| `prompt` * | string | máx 5000 chars |  |
| `duration` * | int | `6`, `8`, `10` | `6` |
| `image_url` * | string | uri |  |
| `resolution` | string | `720p`, `1080p`, `2k`, `4k` | `"720p"` |
| `aspect_ratio` | string | `16:9`, `9:16` | `"16:9"` |
| `end_image_url` | string | uri |  |
| `generate_audio` | bool |  | `true` |
| `camera_movement` | string | `dolly_in`, `dolly_out`, `dolly_left`, `dolly_right`, `jib_up`, `jib_down`, `static`, `focus_shift` |  |

Notas:
- duration is marked required in the schema and has default 6; the API applies this top-level default before validation. The example includes it explicitly.
- Fast supports 720p, 1080p, 2k or 4k and 24, 25, 48 or 50 fps.
- image_url is the required first frame; end_image_url is an optional last frame. aspect_ratio explicitly controls output dimensions.

### LTX-2.5 — Image to video pro

- Slug: `lightricks/ltx-2.5/image-to-video/pro`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/ltx-2-5/image-to-video-pro
- Custo com padrões: **11.52 créditos** (US$ 0.72)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `fps` | int | `24`, `25`, `50` | `25` |
| `prompt` * | string | máx 5000 chars |  |
| `duration` * | int | `6`, `8`, `10` | `6` |
| `image_url` * | string | uri |  |
| `resolution` | string | `720p`, `1080p` | `"720p"` |
| `aspect_ratio` | string | `16:9`, `9:16` | `"16:9"` |
| `end_image_url` | string | uri |  |
| `generate_audio` | bool |  | `true` |
| `camera_movement` | string | `dolly_in`, `dolly_out`, `dolly_left`, `dolly_right`, `jib_up`, `jib_down`, `static`, `focus_shift` |  |

Notas:
- duration is marked required in the schema and has default 6; the API applies this top-level default before validation. The example includes it explicitly.
- Pro supports 720p or 1080p and 24, 25 or 50 fps. Use the Fast endpoint for 2k, 4k or 48 fps.
- image_url is the required first frame; end_image_url is an optional last frame. aspect_ratio explicitly controls output dimensions.

### LTX-2.5 — Text to video fast

- Slug: `lightricks/ltx-2.5/text-to-video/fast`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/ltx-2-5/text-to-video-fast
- Custo com padrões: **8.64 créditos** (US$ 0.54)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `fps` | int | `24`, `25`, `48`, `50` | `25` |
| `prompt` * | string | máx 5000 chars |  |
| `duration` * | int | `6`, `8`, `10` | `6` |
| `resolution` | string | `720p`, `1080p`, `2k`, `4k` | `"720p"` |
| `aspect_ratio` | string | `16:9`, `9:16` | `"16:9"` |
| `generate_audio` | bool |  | `true` |
| `camera_movement` | string | `dolly_in`, `dolly_out`, `dolly_left`, `dolly_right`, `jib_up`, `jib_down`, `static`, `focus_shift` |  |

Notas:
- duration is marked required in the schema and has default 6; the API applies this top-level default before validation. The example includes it explicitly.
- Fast supports 720p, 1080p, 2k or 4k and 24, 25, 48 or 50 fps.

### LTX-2.5 — Text to video pro

- Slug: `lightricks/ltx-2.5/text-to-video/pro`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/ltx-2-5/text-to-video-pro
- Custo com padrões: **11.52 créditos** (US$ 0.72)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `fps` | int | `24`, `25`, `50` | `25` |
| `prompt` * | string | máx 5000 chars |  |
| `duration` * | int | `6`, `8`, `10` | `6` |
| `resolution` | string | `720p`, `1080p` | `"720p"` |
| `aspect_ratio` | string | `16:9`, `9:16` | `"16:9"` |
| `generate_audio` | bool |  | `true` |
| `camera_movement` | string | `dolly_in`, `dolly_out`, `dolly_left`, `dolly_right`, `jib_up`, `jib_down`, `static`, `focus_shift` |  |

Notas:
- duration is marked required in the schema and has default 6; the API applies this top-level default before validation. The example includes it explicitly.
- Pro supports 720p or 1080p and 24, 25 or 50 fps. Use the Fast endpoint for 2k, 4k or 48 fps.

### Marketing Studio Image — 2.0 Alpha

- Slug: `marketing-studio/image`
- Tipo: image_edit, text2image -> image
- Docs: https://docs.higgsfield.ai/docs/models/marketing-studio-image/generate-and-edit
- Custo com padrões: **5.964 créditos** (US$ 0.373)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string | máx 5000 chars |  |
| `quality` | string | `low`, `medium`, `high` | `"high"` |
| `preset_id` | string | uuid |  |
| `image_urls` | array | 0-16 itens; itens uri |  |
| `moderation` | string | `auto`, `low` | `"auto"` |
| `resolution` | string | `1k`, `2k`, `4k` | `"2k"` |
| `aspect_ratio` | string | `auto`, `1:1`, `3:2`, `2:3`, `4:3`, `3:4`, `16:9`, `9:16`, `21:9` | `"auto"` |
| `enhance_prompt` | bool |  | `false` |

Notas:
- Omit image_urls for text-to-image; provide up to 16 URLs for editing when enhance_prompt=false.
- enhance_prompt=true requires an existing preset_id and 1–2 image URLs: product first, optional person/model reference second. Discover presets with GET /marketing-studio/image/presets.
- Reference images must be valid JPEG, PNG, or WebP. Oversized supported images are normalized before rendering.
- With enhancement enabled, aspect_ratio=auto uses the preset ratio. With enhancement disabled, current production mappings use square output for auto.
- The 1k/2k/4k values are resolution tiers; exact pixel dimensions depend on the aspect ratio.
- With enhance_prompt=true, quality must be high. This endpoint accepts low, medium, or high for unenhanced requests.

### Marketing Studio Image — 2.5 Flare

- Slug: `marketing-studio/image/flare`
- Tipo: image_edit, text2image -> image
- Docs: https://docs.higgsfield.ai/docs/models/marketing-studio-image/flare
- Custo: Per 1M tokens: text input $5, cached text input $1.25, text output $10; image input $8, cached image input $2, image output $30. Quality defaults to high. Final cost uses actual token usage and standard credit rounding. The initial charge is an estimate reconciled on completion.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string | máx 5000 chars |  |
| `quality` | string | `low`, `medium`, `high`, `xhigh`, `max` | `"high"` |
| `preset_id` | string | uuid |  |
| `image_urls` | array | 0-16 itens; itens uri |  |
| `moderation` | string | `auto`, `low` | `"auto"` |
| `resolution` | string | `1k`, `2k`, `4k` | `"2k"` |
| `aspect_ratio` | string | `auto`, `1:1`, `3:2`, `2:3`, `4:3`, `3:4`, `16:9`, `9:16`, `21:9` | `"auto"` |
| `enhance_prompt` | bool |  | `false` |

Notas:
- Omit image_urls for text-to-image; provide up to 16 URLs for editing when enhance_prompt=false.
- enhance_prompt=true requires an existing preset_id and 1–2 image URLs: product first, optional person/model reference second. Discover presets with GET /marketing-studio/image/presets.
- Reference images must be valid JPEG, PNG, or WebP. Oversized supported images are normalized before rendering.
- With enhancement enabled, aspect_ratio=auto uses the preset ratio. With enhancement disabled, current production mappings use square output for auto.
- The 1k/2k/4k values are resolution tiers; exact pixel dimensions depend on the aspect ratio.
- quality accepts low, medium, high, xhigh, max and remains selectable with enhancement enabled.

### Marketing Studio Image — 2.5 Sunburst

- Slug: `marketing-studio/image/sunburst`
- Tipo: image_edit, text2image -> image
- Docs: https://docs.higgsfield.ai/docs/models/marketing-studio-image/sunburst
- Custo: Per 1M tokens: text input $5, cached text input $1.25, text output $10; image input $8, cached image input $2, image output $30. Quality defaults to high. Final cost uses actual token usage and standard credit rounding. The initial charge is an estimate reconciled on completion.

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string | máx 5000 chars |  |
| `quality` | string | `low`, `medium`, `high`, `xhigh`, `max` | `"high"` |
| `preset_id` | string | uuid |  |
| `image_urls` | array | 0-16 itens; itens uri |  |
| `moderation` | string | `auto`, `low` | `"auto"` |
| `resolution` | string | `1k`, `2k`, `4k` | `"2k"` |
| `aspect_ratio` | string | `auto`, `1:1`, `3:2`, `2:3`, `4:3`, `3:4`, `16:9`, `9:16`, `21:9` | `"auto"` |
| `enhance_prompt` | bool |  | `false` |

Notas:
- Omit image_urls for text-to-image; provide up to 16 URLs for editing when enhance_prompt=false.
- enhance_prompt=true requires an existing preset_id and 1–2 image URLs: product first, optional person/model reference second. Discover presets with GET /marketing-studio/image/presets.
- Reference images must be valid JPEG, PNG, or WebP. Oversized supported images are normalized before rendering.
- With enhancement enabled, aspect_ratio=auto uses the preset ratio. With enhancement disabled, current production mappings use square output for auto.
- The 1k/2k/4k values are resolution tiers; exact pixel dimensions depend on the aspect ratio.
- quality accepts low, medium, high, xhigh, max and remains selectable with enhancement enabled.

### MiniMax H3 — Image to video

- Slug: `minimax/h3/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/minimax-h3/image-to-video
- Custo com padrões: **8.84 créditos** (US$ 0.553)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | 5..15 | `5` |
| `image_url` * | string | uri |  |
| `resolution` | string | `2K` | `"2K"` |
| `aspect_ratio` | string | `auto`, `adaptive`, `21:9`, `16:9`, `4:3`, `1:1`, `3:4`, `9:16` | `"auto"` |
| `end_image_url` | string | uri |  |
| `aigc_watermark` | bool |  | `false` |

Notas:
- Resolution is fixed to the case-sensitive schema value "2K". The prompt must contain non-whitespace text; the current provider serializer uses only its first 7,000 characters.
- The output aspect ratio follows the input keyframe even when aspect_ratio is supplied. end_image_url is an optional last frame.

### MiniMax H3 — Reference to video

- Slug: `minimax/h3/reference-to-video`
- Tipo: image2video, video2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/minimax-h3/reference-to-video

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | 5..15 | `5` |
| `audio_urls` | array | 0-3 itens; itens uri |  |
| `image_urls` | array | 1-9 itens; itens uri |  |
| `resolution` | string | `2K` | `"2K"` |
| `video_urls` | array | 1-3 itens; itens uri |  |
| `aspect_ratio` | string | `auto`, `adaptive`, `21:9`, `16:9`, `4:3`, `1:1`, `3:4`, `9:16` | `"auto"` |
| `aigc_watermark` | bool |  | `false` |

Notas:
- Resolution is fixed to the case-sensitive schema value "2K". The prompt must contain non-whitespace text; the current provider serializer uses only its first 7,000 characters.
- Provide at least one image or video reference. Audio references require an image or video reference and cannot be used alone.
- Reference media may be cropped, resized, transcoded and trimmed. Video duration and audio duration are each normalized to fit within the provider's 15-second total budget.

### MiniMax H3 — Text to video

- Slug: `minimax/h3/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/minimax-h3/text-to-video
- Custo com padrões: **8.84 créditos** (US$ 0.553)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | 5..15 | `5` |
| `resolution` | string | `2K` | `"2K"` |
| `aspect_ratio` | string | `auto`, `adaptive`, `21:9`, `16:9`, `4:3`, `1:1`, `3:4`, `9:16` | `"auto"` |
| `aigc_watermark` | bool |  | `false` |

Notas:
- Resolution is fixed to the case-sensitive schema value "2K". The prompt must contain non-whitespace text; the current provider serializer uses only its first 7,000 characters.
- For text-only requests, aspect_ratio="auto" or "adaptive" resolves to 16:9.

### Hailuo 2.3 — Standard image to video

- Slug: `minimax/hailuo-2.3/standard/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/hailuo-2-3/standard-image-to-video
- Custo com padrões: **3.808 créditos** (US$ 0.238)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | `6`, `10` | `6` |
| `image_url` * | string | uri |  |
| `prompt_optimizer` | bool |  | `true` |

Notas:
- This Standard endpoint uses a fixed 768P output resolution; resolution is not a configurable field in the production schema.

### Hailuo 2.3 — Standard text to video

- Slug: `minimax/hailuo-2.3/standard/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/hailuo-2-3/standard-text-to-video
- Custo com padrões: **3.808 créditos** (US$ 0.238)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | `6`, `10` | `6` |
| `prompt_optimizer` | bool |  | `true` |

Notas:
- This Standard endpoint uses a fixed 768P output resolution; resolution is not a configurable field in the production schema.

### PixVerse V6 — Image to video

- Slug: `pixverse/v6/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/pixverse-v6/image-to-video
- Custo com padrões: **4.08 créditos** (US$ 0.255)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 0..2147483647 |  |
| `prompt` * | string | máx 5000 chars |  |
| `duration` | number | 1..15 | `5` |
| `image_url` * | string | uri |  |
| `resolution` | string | `360p`, `540p`, `720p`, `1080p` | `"720p"` |
| `end_image_url` | string | uri |  |
| `generate_audio` | bool |  | `true` |
| `negative_prompt` | string | máx 2048 chars |  |

Notas:
- duration is a number from 1 to 15, so the schema allows fractional values. If negative_prompt is supplied, it must contain 1–2,048 characters.
- Use image_url for the first frame and optional end_image_url for the last frame. This endpoint has no aspect_ratio parameter; framing comes from the input image.

### PixVerse V6 — Text to video

- Slug: `pixverse/v6/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/pixverse-v6/text-to-video
- Custo com padrões: **4.08 créditos** (US$ 0.255)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 0..2147483647 |  |
| `prompt` * | string | máx 5000 chars |  |
| `duration` | number | 1..15 | `5` |
| `resolution` | string | `360p`, `540p`, `720p`, `1080p` | `"720p"` |
| `aspect_ratio` | string | `16:9`, `4:3`, `1:1`, `3:4`, `9:16` | `"16:9"` |
| `generate_audio` | bool |  | `true` |
| `negative_prompt` | string | máx 2048 chars |  |

Notas:
- duration is a number from 1 to 15, so the schema allows fractional values. If negative_prompt is supplied, it must contain 1–2,048 characters.

### Recraft V4.1 Pro — Text to image

- Slug: `recraft/v4.1/pro/text-to-image`
- Tipo: text2image -> image
- Docs: https://docs.higgsfield.ai/docs/models/recraft-v4-1-pro/generate
- Custo com padrões: **3.36 créditos** (US$ 0.21)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `colors` | array |  |  |
| `prompt` * | string | máx 10000 chars |  |
| `resolution` | string | `2k` | `"2k"` |
| `aspect_ratio` | string | `1:1`, `2:1`, `1:2`, `3:2`, `2:3`, `4:3`, `3:4`, `5:4`, `4:5`, `6:10`, `14:10`, `10:14`, `16:9`, `9:16` | `"1:1"` |
| `output_format` | string | `jpg`, `png`, `webp` | `"jpg"` |
| `background_color` | object |  |  |

Notas:
- This variant accepts only resolution=2k; use the separate standard/Pro endpoint for the other resolution tier.
- colors is an array of objects shaped as {"rgb": [R, G, B]}; background_color is one such object. Every RGB value is an integer 0–255, with exactly three entries.
- output_format is jpg, png, or webp; default is jpg. No reference-image input is declared.
- prompt must contain 1–10000 characters. Fourteen aspect-ratio values are listed in the schema, including 6:10, 14:10, and 10:14.

### Recraft V4.1 — Text to image

- Slug: `recraft/v4.1/text-to-image`
- Tipo: text2image -> image
- Docs: https://docs.higgsfield.ai/docs/models/recraft-v4-1/text-to-image
- Custo com padrões: **0.56 créditos** (US$ 0.035)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `colors` | array |  |  |
| `prompt` * | string | máx 10000 chars |  |
| `resolution` | string | `1k` | `"1k"` |
| `aspect_ratio` | string | `1:1`, `2:1`, `1:2`, `3:2`, `2:3`, `4:3`, `3:4`, `5:4`, `4:5`, `6:10`, `14:10`, `10:14`, `16:9`, `9:16` | `"1:1"` |
| `output_format` | string | `jpg`, `png`, `webp` | `"jpg"` |
| `background_color` | object |  |  |

Notas:
- This variant accepts only resolution=1k; use the separate standard/Pro endpoint for the other resolution tier.
- colors is an array of objects shaped as {"rgb": [R, G, B]}; background_color is one such object. Every RGB value is an integer 0–255, with exactly three entries.
- output_format is jpg, png, or webp; default is jpg. No reference-image input is declared.
- prompt must contain 1–10000 characters. Fourteen aspect-ratio values are listed in the schema, including 6:10, 14:10, and 10:14.

### Recraft V4.1 Utility Pro — Text to image

- Slug: `recraft/v4.1/utility/pro/text-to-image`
- Tipo: text2image -> image
- Docs: https://docs.higgsfield.ai/docs/models/recraft-v4-1-utility-pro/text-to-image
- Custo com padrões: **3.36 créditos** (US$ 0.21)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `colors` | array |  |  |
| `prompt` * | string | máx 10000 chars |  |
| `resolution` | string | `2k` | `"2k"` |
| `aspect_ratio` | string | `1:1`, `2:1`, `1:2`, `3:2`, `2:3`, `4:3`, `3:4`, `5:4`, `4:5`, `6:10`, `14:10`, `10:14`, `16:9`, `9:16` | `"1:1"` |
| `output_format` | string | `jpg`, `png`, `webp` | `"jpg"` |
| `background_color` | object |  |  |

Notas:
- This variant accepts only resolution=2k; use the separate standard/Pro endpoint for the other resolution tier.
- colors is an array of objects shaped as {"rgb": [R, G, B]}; background_color is one such object. Every RGB value is an integer 0–255, with exactly three entries.
- output_format is jpg, png, or webp; default is jpg. No reference-image input is declared.
- prompt must contain 1–10000 characters. Fourteen aspect-ratio values are listed in the schema, including 6:10, 14:10, and 10:14.

### Recraft V4.1 Utility — Text to image

- Slug: `recraft/v4.1/utility/text-to-image`
- Tipo: text2image -> image
- Docs: https://docs.higgsfield.ai/docs/models/recraft-v4-1-utility/text-to-image
- Custo com padrões: **0.56 créditos** (US$ 0.035)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `colors` | array |  |  |
| `prompt` * | string | máx 10000 chars |  |
| `resolution` | string | `1k` | `"1k"` |
| `aspect_ratio` | string | `1:1`, `2:1`, `1:2`, `3:2`, `2:3`, `4:3`, `3:4`, `5:4`, `4:5`, `6:10`, `14:10`, `10:14`, `16:9`, `9:16` | `"1:1"` |
| `output_format` | string | `jpg`, `png`, `webp` | `"jpg"` |
| `background_color` | object |  |  |

Notas:
- This variant accepts only resolution=1k; use the separate standard/Pro endpoint for the other resolution tier.
- colors is an array of objects shaped as {"rgb": [R, G, B]}; background_color is one such object. Every RGB value is an integer 0–255, with exactly three entries.
- output_format is jpg, png, or webp; default is jpg. No reference-image input is declared.
- prompt must contain 1–10000 characters. Fourteen aspect-ratio values are listed in the schema, including 6:10, 14:10, and 10:14.

### Soul ID — Create character

- Slug: `soul-id` (endpoint `POST /v1/custom-references`)
- Tipo: character -> image
- Docs: https://docs.higgsfield.ai/docs/models/soul-id/create-character
- Custo com padrões: **40 créditos** (US$ 2.5)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `name` * | string | máx 100 chars |  |
| `model_version` | ref |  | `"v1"` |
| `input_images` * | array | 1-100 itens |  |

Notas:
- Soul ID trains a reusable character reference. This is not an image-generation endpoint; do not POST to /soul-id.
- Use POST /v1/custom-references with application/json. name has a maximum length of 100; input_images must contain 1–100 {"type":"image_url","image_url":"..."} objects.
- model_version accepts v1, v2, cinema; its default is v1. Choose the matching generation family.
- The creation response returns id and status. Poll GET /v1/custom-references/{id}; statuses are not_ready, queued, in_progress, completed, and failed.
- After completion, pass the returned id as custom_reference_id to the matching Soul generation endpoint. References are scoped to the account that created them.

### Wan 2.6 — Image to video

- Slug: `wan/v2.6/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/wan-2-6/image-to-video
- Custo com padrões: **6.8 créditos** (US$ 0.425)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | -1..10000000 |  |
| `prompt` * | string |  |  |
| `duration` | int | `5`, `10`, `15` | `5` |
| `audio_url` | string | uri |  |
| `image_url` * | string | uri |  |
| `resolution` | string | `480p`, `720p`, `1080p` | `"720p"` |
| `multi_shots` | bool |  | `false` |
| `prompt_extend` | bool |  | `false` |
| `negative_prompt` | string |  | `""` |

Notas:
- Setting multi_shots=true also enables prompt_extend, even if prompt_extend was false.
- Input images may be resized to fit a 1,440-pixel maximum dimension before generation. A last-frame input is unsupported.

### Wan 2.6 — Reference to video

- Slug: `wan/v2.6/reference-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/wan-2-6/reference-to-video
- Custo com padrões: **6.8 créditos** (US$ 0.425)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | `5`, `10` | `5` |
| `resolution` | string | `720p`, `1080p` | `"720p"` |
| `video_urls` * | array | 1-3 itens; itens uri |  |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1`, `4:3`, `3:4` | `"16:9"` |

Notas:
- Supply 1–3 reference videos. This endpoint supports only 5 or 10 seconds, unlike the text and image endpoints that also support 15 seconds.

### Wan 2.6 — Text to video

- Slug: `wan/v2.6/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/wan-2-6/text-to-video
- Custo com padrões: **6.8 créditos** (US$ 0.425)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | -1..10000000 |  |
| `prompt` * | string |  |  |
| `duration` | int | `5`, `10`, `15` | `5` |
| `audio_url` | string | uri |  |
| `resolution` | string | `720p`, `1080p` | `"720p"` |
| `multi_shots` | bool |  | `false` |
| `prompt_extend` | bool |  | `false` |

Notas:
- Setting multi_shots=true also enables prompt_extend, even if prompt_extend was false.

### Wan 2.7 — Image to video

- Slug: `wan/v2.7/image-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/wan-2-7/image-to-video
- Custo com padrões: **6.8 créditos** (US$ 0.425)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 1..2147483646 |  |
| `prompt` | string |  |  |
| `duration` | int | 2..15 | `5` |
| `audio_url` | string | uri |  |
| `image_url` * | string | uri |  |
| `resolution` | string | `720p`, `1080p` | `"720p"` |
| `end_image_url` | string | uri |  |
| `prompt_extend` | bool |  | `false` |
| `negative_prompt` | string |  | `""` |

Notas:
- The prompt is optional. end_image_url supplies a last frame, and audio_url can supply driving audio.

### Wan 2.7 — Reference to video

- Slug: `wan/v2.7/reference-to-video`
- Tipo: image2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/wan-2-7/reference-to-video

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 1..2147483646 |  |
| `prompt` * | string |  |  |
| `duration` | int | 2..10 | `5` |
| `image_urls` | array | itens uri |  |
| `resolution` | string | `720p`, `1080p` | `"720p"` |
| `video_urls` | array | itens uri |  |
| `aspect_ratio` | string | `16:9`, `9:16` | `"16:9"` |
| `prompt_extend` | bool |  | `false` |
| `negative_prompt` | string |  | `""` |

Notas:
- Provide a nonempty image_urls or video_urls array. The combined number of image and video references must not exceed 5; this submission limit is not expressed in the stored JSON Schema.
- Reference generation is limited to 2–10 seconds and aspect ratios 16:9 or 9:16.

### Wan 2.7 — Text to video

- Slug: `wan/v2.7/text-to-video`
- Tipo: text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/wan-2-7/text-to-video
- Custo com padrões: **6.8 créditos** (US$ 0.425)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 1..2147483646 |  |
| `prompt` * | string |  |  |
| `duration` | int | 2..15 | `5` |
| `audio_url` | string | uri |  |
| `resolution` | string | `720p`, `1080p` | `"720p"` |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1`, `4:3`, `3:4` | `"16:9"` |
| `prompt_extend` | bool |  | `false` |
| `negative_prompt` | string |  | `""` |

Notas:
- The prompt must contain text. audio_url can supply driving audio.

### Grok Image 2.0 — Generate and edit

- Slug: `xai/grok-imagine-image-2.0`
- Tipo: image_edit, text2image -> image
- Docs: https://docs.higgsfield.ai/docs/models/grok-image-2/generate-and-edit
- Custo com padrões: **0.96 créditos** (US$ 0.06)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `quality` | string | `low`, `medium` | `"medium"` |
| `image_urls` | array | 0-10 itens; itens uri |  |
| `resolution` | string | `1k`, `2k` | `"1k"` |
| `aspect_ratio` | string | `auto`, `1:1`, `1:2`, `2:1`, `3:2`, `2:3`, `4:3`, `3:4`, `16:9`, `9:16` | `"auto"` |

Notas:
- Supports both text-to-image and editing: omit image_urls for generation, or supply up to 10 references for editing.
- quality accepts low or medium only; resolution accepts 1k or 2k. aspect_ratio defaults to auto.
- Reference images may be resized during preprocessing before submission. The request produces one image; no batch count is declared.

### Grok Imagine Video 1.5 — Reference to video

- Slug: `xai/grok-imagine-video/v1.5/reference-to-video`
- Tipo: image2video, text2video -> video
- Docs: https://docs.higgsfield.ai/docs/models/grok-video-1-5/reference-to-video
- Custo com padrões: **6.4 créditos** (US$ 0.4)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `prompt` * | string |  |  |
| `duration` | int | 1..15 | `5` |
| `audio_url` | string | uri |  |
| `image_url` | string | uri |  |
| `image_urls` | array | 0-7 itens; itens uri |  |
| `resolution` | string | `480p`, `720p`, `1080p` | `"480p"` |
| `aspect_ratio` | string | `auto`, `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3` | `"auto"` |

Notas:
- This endpoint also accepts text-only requests or one first-frame image. Choose either image_url or reference media (image_urls/audio_url); do not combine these modes.
- When image_urls or audio_url is provided, resolution must be 480p or 720p. The shared schema also lists 1080p, which is rejected in reference mode.
- Input images must decode as JPEG, PNG, WebP or GIF; SVG and XML are unsupported.

### Z-Image Turbo — Generate

- Slug: `z-image/turbo`
- Tipo: text2image -> image
- Docs: https://docs.higgsfield.ai/docs/models/z-image-turbo/generate
- Custo com padrões: **0.24 créditos** (US$ 0.015)

| Parâmetro | Tipo | Limites | Padrão |
|---|---|---|---|
| `seed` | int | 0..2147483647 |  |
| `prompt` * | string | máx 800 chars |  |
| `resolution` | string | `1k`, `2k` | `"1k"` |
| `aspect_ratio` | string | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `7:9`, `9:7`, `9:16`, `16:9`, `21:9` | `"1:1"` |
| `prompt_extend` | bool |  | `false` |

Notas:
- Text-to-image only. prompt must contain non-whitespace text and at most 800 characters.
- prompt_extend defaults to false; enabling it uses the enhanced pricing tier.
- The schema accepts 1k and 2k tiers, ten aspect ratios, and an optional integer seed from 0 to 2147483647.
