import "server-only";
import { and, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assets, conversations, generations, type Generation, type SlotInput } from "@/lib/db/schema";
import { getModel, type Mode } from "@/lib/catalog";
import { buildRequestBody } from "@/lib/catalog/request";
import { hf, outputsOf, type HfStatusResponse } from "@/lib/higgsfield/client";
import { ApiError } from "./errors";
import { env } from "./env";
import { assertGenerationRateLimit } from "./rate-limit";
import { extFor, storage, SUPABASE_MAX_BYTES } from "./storage";

export interface CreateGenerationInput {
  conversationId?: string | null;
  modelId: string;
  mode: Mode;
  subtype: string;
  prompt: string;
  negativePrompt?: string | null;
  params: Record<string, unknown>;
  inputs: Record<string, string[]>; // campo -> ids de assets
  parentGenerationId?: string | null;
  parentAssetId?: string | null;
  chainAction?: string | null;
}

function titleFrom(prompt: string, fallback: string) {
  const t = prompt.replace(/\s+/g, " ").trim();
  if (!t) return fallback;
  return t.length > 60 ? `${t.slice(0, 57).trimEnd()}...` : t;
}

/** Resolve assets para URLs assinadas que a Higgsfield consegue baixar (válidas por 24h). */
async function resolveInputs(inputs: Record<string, string[]>) {
  const ids = [...new Set(Object.values(inputs).flat())];
  if (ids.length === 0) return { refs: {} as Record<string, SlotInput[]>, urls: {} as Record<string, string[]> };
  const rows = await db.select().from(assets).where(inArray(assets.id, ids));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const missing = ids.filter((id) => !byId.get(id)?.uploaded);
  if (missing.length) throw new ApiError(400, "asset_missing", "Algum anexo ainda não terminou de enviar ou foi removido.");
  const signed = await storage.signedUrls(rows.map((r) => r.storagePath), 60 * 60 * 24);
  const refs: Record<string, SlotInput[]> = {};
  const urls: Record<string, string[]> = {};
  for (const [field, list] of Object.entries(inputs)) {
    refs[field] = list.map((id) => ({ assetId: id, kind: byId.get(id)!.kind }));
    urls[field] = list.map((id) => signed.get(byId.get(id)!.storagePath)!).filter(Boolean);
  }
  return { refs, urls };
}

function webhookUrl() {
  const base = env.publicUrl;
  if (!base || !env.webhookSecret) return null;
  // Previews da Vercel ficam atrás do Vercel Auth; o webhook só vale em produção.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return null;
  return `${base}/api/webhooks/higgsfield?token=${env.webhookSecret}`;
}

export async function createGeneration(input: CreateGenerationInput): Promise<Generation> {
  const model = getModel(input.modelId);
  if (!model) throw new ApiError(400, "unknown_model", "Modelo não encontrado no catálogo.");
  if (!model.uses.some((u) => u.mode === input.mode && u.subtype === input.subtype)) {
    throw new ApiError(400, "model_mode_mismatch", "Este modelo não atende ao modo escolhido.");
  }

  const { refs, urls } = await resolveInputs(input.inputs);
  const built = buildRequestBody(model, { prompt: input.prompt, negativePrompt: input.negativePrompt ?? undefined, params: input.params, inputs: urls });
  if (!built.ok) throw new ApiError(400, "invalid_params", built.errors[0], built.errors);

  await assertGenerationRateLimit();

  let conversationId = input.conversationId ?? null;
  if (conversationId) {
    const [c] = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.id, conversationId));
    if (!c) conversationId = null;
  }
  if (!conversationId) {
    const [c] = await db.insert(conversations).values({ title: titleFrom(input.prompt, model.name) }).returning();
    conversationId = c.id;
  } else {
    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
  }

  const seed = typeof input.params.seed === "number" ? input.params.seed : null;
  const [gen] = await db
    .insert(generations)
    .values({
      conversationId,
      modelId: model.id,
      mode: input.mode,
      subtype: input.subtype,
      prompt: input.prompt,
      negativePrompt: input.negativePrompt || null,
      params: input.params,
      inputs: refs,
      requestBody: redactUrls(built.body),
      status: "queued",
      seed,
      parentGenerationId: input.parentGenerationId ?? null,
      parentAssetId: input.parentAssetId ?? null,
      chainAction: input.chainAction ?? null,
    })
    .returning();

  const [submitted, est] = await Promise.allSettled([
    hf.submit(model.path, built.body, { idempotencyKey: gen.id, webhookUrl: webhookUrl() }),
    hf.estimate(model.path, built.body),
  ]);

  const estimate =
    est.status === "fulfilled"
      ? est.value.type === "estimate"
        ? { credits: Number(est.value.credits), usd: Number(est.value.usd) }
        : { text: est.value.pricing_description }
      : null;

  if (submitted.status === "rejected") {
    const err = submitted.reason instanceof ApiError ? submitted.reason : new ApiError(502, "hf_network", "Falha ao enviar para a Higgsfield.");
    await db.update(generations).set({ status: "failed", error: err.message, estimate, completedAt: new Date() }).where(eq(generations.id, gen.id));
    throw Object.assign(err, { details: { generationId: gen.id, conversationId } });
  }

  const r = submitted.value;
  const [updated] = await db
    .update(generations)
    .set({ hfRequestId: r.request_id, status: r.status === "in_progress" ? "processing" : "queued", estimate, startedAt: new Date() })
    .where(eq(generations.id, gen.id))
    .returning();
  return updated;
}

function redactUrls(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) out[k] = /_urls?$/.test(k) ? "[anexo]" : v;
  return out;
}

const MAP: Record<HfStatusResponse["status"], Generation["status"]> = {
  queued: "queued",
  in_progress: "processing",
  completed: "processing", // vira "completed" só depois de copiar para o Storage
  failed: "failed",
  nsfw: "nsfw",
  canceled: "canceled",
};

const FAIL_MSG: Partial<Record<Generation["status"], string>> = {
  failed: "A geração falhou na Higgsfield. Nenhum crédito foi cobrado.",
  nsfw: "Conteúdo bloqueado pela moderação da Higgsfield. Nenhum crédito foi cobrado.",
  canceled: "Geração cancelada.",
};

/**
 * Consulta o status na Higgsfield (no máximo a cada 2s por geração) e, quando concluída,
 * dispara a cópia dos resultados. Retorna `ingest` se houver trabalho de cópia a fazer.
 */
export async function syncGeneration(gen: Generation): Promise<{ gen: Generation; ingest?: HfStatusResponse }> {
  if (!gen.hfRequestId || ["completed", "failed", "canceled", "nsfw"].includes(gen.status)) return { gen };
  const fresh = gen.lastPolledAt && Date.now() - gen.lastPolledAt.getTime() < 2000;
  if (fresh) return { gen };

  await db.update(generations).set({ lastPolledAt: new Date() }).where(eq(generations.id, gen.id));
  let r: HfStatusResponse;
  try {
    r = await hf.status(gen.hfRequestId);
  } catch {
    return { gen }; // erro transitório: o cliente tenta de novo no próximo ciclo
  }
  return applyStatus(gen, r);
}

export async function applyStatus(gen: Generation, r: HfStatusResponse): Promise<{ gen: Generation; ingest?: HfStatusResponse }> {
  const next = MAP[r.status] ?? gen.status;
  if (r.status === "completed") {
    const [g] = await db.update(generations).set({ status: "processing" }).where(eq(generations.id, gen.id)).returning();
    return { gen: g, ingest: r };
  }
  if (next !== gen.status || FAIL_MSG[next]) {
    const terminal = ["failed", "nsfw", "canceled"].includes(next);
    const [g] = await db
      .update(generations)
      .set({ status: next, error: terminal ? (r.error ? `${FAIL_MSG[next]} (${r.error})` : FAIL_MSG[next]) : null, completedAt: terminal ? new Date() : null })
      .where(eq(generations.id, gen.id))
      .returning();
    return { gen: g };
  }
  return { gen };
}

/** Baixa as saídas da Higgsfield e guarda no Storage (as URLs de CDN expiram). Idempotente com trava. */
export async function ingestOutputs(genId: string, r: HfStatusResponse) {
  const [locked] = await db
    .update(generations)
    .set({ ingestStartedAt: new Date() })
    .where(
      and(
        eq(generations.id, genId),
        sql`${generations.status} <> 'completed'`,
        or(isNull(generations.ingestStartedAt), lt(generations.ingestStartedAt, new Date(Date.now() - 5 * 60_000))),
      ),
    )
    .returning();
  if (!locked) return;

  try {
    const outs = outputsOf(r);
    if (outs.length === 0) throw new Error("Resposta concluída sem arquivos de saída.");
    const existing = await db.select({ originalUrl: assets.originalUrl }).from(assets).where(eq(assets.generationId, genId));
    const done = new Set(existing.map((e) => e.originalUrl));
    for (const [i, o] of outs.entries()) {
      if (done.has(o.url)) continue;
      const res = await fetch(o.url, { cache: "no-store" });
      if (!res.ok || !res.body) throw new Error(`download ${res.status}`);
      const mime = o.contentType || res.headers.get("content-type")?.split(";")[0] || (o.kind === "video" ? "video/mp4" : o.kind === "audio" ? "audio/mpeg" : "image/png");
      const size = Number(res.headers.get("content-length")) || undefined;
      let path = `generations/${genId}/${i}.${extFor(mime, o.url)}`;
      if (size && size > SUPABASE_MAX_BYTES) {
        // Acima do limite do Supabase: mantém no CDN da Higgsfield (retenção mínima de 7 dias).
        await res.body.cancel();
        path = `hf:${o.url}`;
      } else {
        try {
          await storage.uploadStream(path, res.body, mime, size);
        } catch (e) {
          if (!String(e).includes("413") && !String(e).includes("EntityTooLarge") && !String(e).includes("exceeded")) throw e;
          path = `hf:${o.url}`;
        }
      }
      await db.insert(assets).values({ kind: o.kind, source: "generation", generationId: genId, position: i, storagePath: path, mime, size: size ?? null, originalUrl: o.url, uploaded: true });
    }
    await db.update(generations).set({ status: "completed", completedAt: new Date(), error: null }).where(eq(generations.id, genId));
  } catch (e) {
    console.error("[ingest]", genId, e);
    await db.update(generations).set({ ingestStartedAt: null }).where(eq(generations.id, genId));
  }
}
