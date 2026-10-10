#!/usr/bin/env node
/**
 * Sincroniza o catálogo de modelos da Higgsfield.
 *
 * Fontes (nada é inventado):
 *  - GET https://api.higgsfield.ai/models            -> modelos disponíveis para a conta
 *  - https://docs.higgsfield.ai/docs/llms-full.txt   -> schema JSON completo e notas de uso de cada endpoint
 *  - POST https://api.higgsfield.ai/estimate/<slug>  -> custo com os parâmetros padrão
 *
 * Saídas:
 *  - lib/catalog/generated/models.json
 *  - docs/API_MAP.md
 *
 * Uso: node --env-file=.env.local scripts/sync-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const API = "https://api.higgsfield.ai";
const DOCS = "https://docs.higgsfield.ai/docs/llms-full.txt";
const id = process.env.HIGGSFIELD_API_KEY_ID;
const secret = process.env.HIGGSFIELD_API_KEY_SECRET;
if (!id || !secret) {
  console.error("Defina HIGGSFIELD_API_KEY_ID e HIGGSFIELD_API_KEY_SECRET (.env.local).");
  process.exit(1);
}
const AUTH = { Authorization: `Key ${id}:${secret}` };

async function getJson(url, init) {
  const r = await fetch(url, init);
  const text = await r.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: r.status, body };
}

// ---------- 1. Modelos da conta
const models = (await getJson(`${API}/models`, { headers: AUTH })).body;
if (!models?.items) throw new Error("Resposta inesperada de GET /models");
console.log(`API: ${models.items.length} modelos na conta`);

// ---------- 2. Docs: schema por endpoint
const full = await (await fetch(DOCS)).text();
const pages = full.split(/\n# (?=[^\n]+\nSource: )/);
const docs = {};
for (const p of pages) {
  const src = /^Source: (\S+)/m.exec(p);
  if (!src) continue;
  const ep = /\*\*(?:Endpoint|Catalog) ID:\*\* `([^`]+)`/.exec(p);
  if (!ep) continue;
  const endpoint = /\*\*Endpoint:\*\* `(\w+) https:\/\/api\.higgsfield\.ai\/([^`]+)`/.exec(p);
  const js = /Complete JSON schema">\s*```json[^\n]*\n([\s\S]*?)```/.exec(p);
  const notes = /## Usage notes\n([\s\S]*?)\n## /.exec(p);
  let schema = null;
  if (js) {
    try { schema = JSON.parse(js[1]); } catch (e) { console.warn("schema inválido", ep[1], e.message); }
  }
  docs[ep[1]] = {
    docUrl: src[1],
    docTitle: p.split("\n")[0].replace(/ API$/, ""),
    method: endpoint?.[1] ?? "POST",
    path: endpoint?.[2] ?? ep[1],
    schema,
    notes: notes
      ? notes[1].split(/\n\* /).map((s) => s.replace(/^\* /, "").replace(/\\_/g, "_").replace(/\\([{}<>[\]])/g, "$1").replace(/\s+/g, " ").trim()).filter(Boolean)
      : [],
  };
}
console.log(`Docs: ${Object.keys(docs).length} endpoints com schema`);

// ---------- 3. Estimativa de custo com padrões
const SAMPLE = {
  image: "https://cdn.higgsfield.ai/soul-v2-style/c1d13313-1a78-4f55-acd3-125e789d202f.webp",
  video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  audio: "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav",
};
function sampleValue(name, def) {
  if (/video_url$/.test(name)) return SAMPLE.video;
  if (/audio_url$/.test(name)) return SAMPLE.audio;
  if (/_url$/.test(name)) return SAMPLE.image;
  if (name === "video_urls") return [SAMPLE.video];
  if (name === "audio_urls") return [SAMPLE.audio];
  if (/image_urls$/.test(name)) return [SAMPLE.image];
  if (name === "prompt") return "a quiet street at dawn";
  if (def?.default !== undefined) return def.default;
  if (def?.enum) return def.enum[0];
  if (def?.type === "integer" || def?.type === "number") return def.minimum ?? 1;
  return "x";
}
async function estimate(slug, schema) {
  if (!schema) return null;
  const body = {};
  for (const k of schema.required ?? []) body[k] = sampleValue(k, schema.properties?.[k]);
  if (schema.properties?.prompt) body.prompt = "a quiet street at dawn";
  if (schema.properties?.first_frame_url && !body.first_frame_url) body.first_frame_url = SAMPLE.image;
  const r = await getJson(`${API}/estimate/${slug}`, {
    method: "POST",
    headers: { ...AUTH, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.status !== 200) return { type: "unavailable" };
  if (r.body.type === "estimate") return { type: "credits", credits: Number(r.body.credits), usd: Number(r.body.usd) };
  if (r.body.type === "description") return { type: "description", text: r.body.pricing_description };
  return { type: "unavailable" };
}

const out = [];
const queue = [...models.items];
async function worker() {
  while (queue.length) {
    const m = queue.shift();
    const d = docs[m.slug];
    out.push({
      slug: m.slug,
      title: m.title,
      description: m.description,
      operationType: m.operation_type,
      outputType: m.output_type,
      baseCredits: Number(m.base_credits),
      isWorkflow: m.is_workflow,
      docUrl: d?.docUrl ?? null,
      docTitle: d?.docTitle ?? null,
      method: d?.method ?? null,
      path: d?.path ?? null,
      schema: d?.schema ?? null,
      notes: d?.notes ?? [],
      estimate: await estimate(m.slug, d?.schema),
    });
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
out.sort((a, b) => a.slug.localeCompare(b.slug));
fs.writeFileSync(path.join(ROOT, "lib/catalog/generated/models.json"), JSON.stringify({ syncedAt: new Date().toISOString(), models: out }, null, 1) + "\n");

// Versão enxuta para o bundle do app (sem textos longos da documentação).
const KEEP = ["type", "enum", "default", "minimum", "maximum", "multipleOf", "maxLength", "minItems", "maxItems", "format", "items", "anyOf", "const", "properties", "required"];
function slim(node) {
  if (Array.isArray(node)) return node.map(slim);
  if (!node || typeof node !== "object") return node;
  const o = {};
  for (const [k, v] of Object.entries(node)) if (KEEP.includes(k) || k === "allOf" || k === "if" || k === "then") o[k] = k === "properties" ? Object.fromEntries(Object.entries(v).map(([a, b]) => [a, slim(b)])) : slim(v);
  return o;
}
function deref(schema) {
  if (!schema?.$defs) return schema;
  const txt = JSON.stringify(schema, (k, v) => (v && typeof v === "object" && typeof v.$ref === "string" ? { ...schema.$defs[v.$ref.split("/").pop()], ...Object.fromEntries(Object.entries(v).filter(([a]) => a !== "$ref")) } : v));
  const r = JSON.parse(txt);
  delete r.$defs;
  return r;
}
const slimModels = out
  .filter((m) => m.schema)
  .map((m) => ({
    slug: m.slug,
    path: m.path,
    docTitle: m.docTitle,
    operationType: m.operationType,
    outputType: m.outputType,
    estimate: m.estimate,
    schema: slim(deref(m.schema)),
  }));
fs.writeFileSync(path.join(ROOT, "lib/catalog/generated/catalog.json"), JSON.stringify({ syncedAt: new Date().toISOString(), models: slimModels }) + "\n");

// ---------- 4. API_MAP.md
const short = { string: "string", integer: "int", number: "number", boolean: "bool", array: "array", object: "object" };
function describe(name, def, required) {
  const t = def.anyOf ? def.anyOf.map((x) => short[x.type] ?? x.type).join(" \\| ") : short[def.type] ?? def.type ?? (def.$ref ? "ref" : "?");
  const lim = [];
  if (def.enum) lim.push(def.enum.map((v) => `\`${v}\``).join(", "));
  if (def.minimum !== undefined || def.maximum !== undefined) lim.push(`${def.minimum ?? ""}..${def.maximum ?? ""}`);
  if (def.maxLength) lim.push(`máx ${def.maxLength} chars`);
  if (def.minItems !== undefined || def.maxItems !== undefined) lim.push(`${def.minItems ?? 0}-${def.maxItems ?? "∞"} itens`);
  if (def.format) lim.push(def.format);
  if (def.items?.format) lim.push(`itens ${def.items.format}`);
  const dflt = def.default !== undefined ? `\`${JSON.stringify(def.default)}\`` : "";
  return `| \`${name}\`${required ? " *" : ""} | ${t} | ${lim.join("; ").replace(/\|/g, "\\|")} | ${dflt} |`;
}
const CAT = { text2image: "Imagem", image_edit: "Edição de imagem", text2video: "Vídeo", image2video: "Vídeo", video2video: "Vídeo (edição)", character: "Personagem" };
const lines = [];
lines.push("# Mapa da API Higgsfield", "");
lines.push(`Gerado por \`scripts/sync-catalog.mjs\` em ${new Date().toISOString().slice(0, 10)}. Fontes: \`GET /models\` (conta), docs oficiais (\`llms-full.txt\`) e \`POST /estimate/<slug>\`.`, "");
lines.push("## Base", "");
lines.push("- Base URL: `https://api.higgsfield.ai`. Auth: `Authorization: Key <ID>:<SECRET>` (somente servidor).");
lines.push("- Submissão: `POST /<slug>` com JSON. Header opcional `Idempotency-Key`. Webhook: query `?hf_webhook=<url https>`.");
lines.push("- Resposta: `{ status, request_id, status_url, cancel_url }`. Status: `queued`, `in_progress`, `completed`, `failed`, `nsfw`, `canceled`.");
lines.push("- Status: `GET /requests/{id}/status` (saída em `images[]`, `video`, `audio`). Cancelar: `POST /requests/{id}/cancel` (202, só enquanto `queued`).");
lines.push("- Upload: `POST /files/generate-upload-url {content_type}` -> `{upload_url, public_url, upload_headers}`; PUT do arquivo. Tipos: jpeg, png, webp, gif, wav, mp4.");
lines.push("- Estimativa: `POST /estimate/<slug>` com o mesmo corpo -> `{type:'estimate', credits, usd}` ou `{type:'description', pricing_description}`.");
lines.push("- Catálogo: `GET /models`. Estilos SOUL: `GET /v1/text2image/soul-styles` e `/v2`. Presets: `GET /models/higgsfield/genjutsu/restyle/v1.0/presets`, `GET /marketing-studio/image/presets`.");
lines.push("- Personagens (Soul ID): `POST /v1/custom-references`, `GET /v1/custom-references/{id}`, `GET /v1/custom-references/list?page=&page_size=`.");
lines.push("- Saldo de créditos: **não há endpoint documentado** na API. Erro `403 not_enough_credits` indica saldo insuficiente.");
lines.push("- Erros: 400 (parâmetro/concorrência), 401 (credencial), 403 (créditos), 404, 422 (validação), 423 (modelo bloqueado), 500, 503.");
lines.push("- Saídas ficam disponíveis por ao menos 7 dias; o app copia tudo para o Supabase Storage.", "");
lines.push("## Resumo", "");
lines.push("| Modelo | Slug | Categoria | Saída | Custo (padrões) |", "|---|---|---|---|---|");
for (const m of out) {
  const c = m.estimate?.type === "credits" ? `${m.estimate.credits} cr (US$ ${m.estimate.usd})` : m.estimate?.type === "description" ? "variável (ver detalhe)" : m.schema ? "n/d" : "sem schema público";
  lines.push(`| ${m.docTitle ?? m.title} | \`${m.slug}\` | ${m.operationType.map((o) => CAT[o] ?? o).join(", ")} | ${m.outputType} | ${c} |`);
}
lines.push("");
lines.push("## Detalhe por modelo", "");
for (const m of out) {
  lines.push(`### ${m.docTitle ?? m.title}`, "");
  lines.push(`- Slug: \`${m.slug}\`${m.path && m.path !== m.slug ? ` (endpoint \`${m.method} /${m.path}\`)` : ""}`);
  lines.push(`- Tipo: ${m.operationType.join(", ")} -> ${m.outputType}${m.isWorkflow ? " (workflow)" : ""}`);
  if (m.docUrl) lines.push(`- Docs: ${m.docUrl}`);
  if (m.estimate?.type === "credits") lines.push(`- Custo com padrões: **${m.estimate.credits} créditos** (US$ ${m.estimate.usd})`);
  if (m.estimate?.type === "description") lines.push(`- Custo: ${m.estimate.text}`);
  if (!m.schema) lines.push("- **Sem schema público na documentação**: não exposto no app.");
  if (m.schema?.properties) {
    lines.push("", "| Parâmetro | Tipo | Limites | Padrão |", "|---|---|---|---|");
    for (const [k, v] of Object.entries(m.schema.properties)) lines.push(describe(k, v, m.schema.required?.includes(k)));
  }
  if (m.notes.length) {
    lines.push("", "Notas:");
    for (const n of m.notes) lines.push(`- ${n}`);
  }
  lines.push("");
}
fs.writeFileSync(path.join(ROOT, "docs/API_MAP.md"), lines.join("\n"));
console.log(`OK: ${out.length} modelos, ${out.filter((m) => m.schema).length} com schema.`);
