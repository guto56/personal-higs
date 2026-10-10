import "server-only";
import { env } from "@/lib/server/env";
import { ApiError } from "@/lib/server/errors";

const BASE = "https://api.higgsfield.ai";

export type HfStatus = "queued" | "in_progress" | "completed" | "failed" | "nsfw" | "canceled";

export interface HfStatusResponse {
  status: HfStatus;
  request_id: string;
  status_url?: string;
  cancel_url?: string;
  error?: string | null;
  images?: { url: string; content_type?: string }[];
  video?: { url: string; content_type?: string } | null;
  audio?: { url: string } | null;
  audios?: { url: string }[];
  progress?: number;
}

function headers(extra?: Record<string, string>) {
  return {
    Authorization: `Key ${env.hfKeyId}:${env.hfKeySecret}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extra,
  };
}

/** Traduz erros da API para mensagens claras em português. */
export function translateHfError(status: number, detail: unknown): ApiError {
  const raw = typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((d) => (d as { msg?: string })?.msg ?? JSON.stringify(d)).join("; ") : "";
  const lower = raw.toLowerCase();
  if (status === 401) return new ApiError(502, "hf_auth", "A chave da API Higgsfield foi recusada. Verifique as credenciais nas variáveis de ambiente.");
  if (status === 403 || lower.includes("not_enough_credits")) return new ApiError(402, "no_credits", "Créditos insuficientes na conta da API Higgsfield. Recarregue em console.higgsfield.ai.");
  if (status === 404) return new ApiError(404, "hf_not_found", "Modelo ou requisição não encontrado para esta conta.");
  if (status === 423) return new ApiError(503, "model_blocked", "Este modelo está temporariamente bloqueado pela Higgsfield. Tente outro ou aguarde.");
  if (status === 503) return new ApiError(503, "model_unavailable", "Este modelo está indisponível no momento. Tente de novo mais tarde.");
  if (status === 400 && lower.includes("concurrent")) return new ApiError(429, "hf_concurrency", "Limite de gerações simultâneas da conta atingido. Aguarde uma terminar.");
  if (status === 400 || status === 422) {
    const field = /'([a-z_]+)' is a required property/.exec(raw)?.[1];
    if (field) return new ApiError(400, "hf_validation", `Falta um campo obrigatório para este modelo: ${field}.`);
    if (lower.includes("idempotency")) return new ApiError(409, "hf_idempotency", "Requisição duplicada com parâmetros diferentes.");
    return new ApiError(400, "hf_validation", raw ? `A Higgsfield recusou os parâmetros: ${raw.slice(0, 240)}` : "A Higgsfield recusou os parâmetros enviados.");
  }
  if (status >= 500) return new ApiError(502, "hf_server", "A Higgsfield teve um erro interno. Tente de novo em instantes.");
  return new ApiError(502, "hf_unknown", "Resposta inesperada da Higgsfield.");
}

async function request<T>(method: "GET" | "POST", path: string, body?: unknown, extra?: Record<string, string>, retries = 0): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers: headers(extra),
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      });
      const text = await res.text();
      let json: unknown = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = text;
      }
      if (!res.ok) {
        const err = translateHfError(res.status, (json as { detail?: unknown })?.detail ?? json);
        if (res.status >= 500 && attempt < retries) {
          lastErr = err;
          await new Promise((r) => setTimeout(r, 500 * 2 ** attempt + Math.random() * 300));
          continue;
        }
        throw err;
      }
      return json as T;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      lastErr = e;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt + Math.random() * 300));
        continue;
      }
    }
  }
  if (lastErr instanceof ApiError) throw lastErr;
  throw new ApiError(502, "hf_network", "Não foi possível falar com a Higgsfield. Verifique a conexão e tente de novo.");
}

export const hf = {
  /** Envia uma geração. Retorna assim que o job é aceito (não espera terminar). */
  submit(path: string, body: Record<string, unknown>, opts: { idempotencyKey: string; webhookUrl?: string | null }) {
    const qs = opts.webhookUrl ? `?hf_webhook=${encodeURIComponent(opts.webhookUrl)}` : "";
    // Reenvio com a mesma Idempotency-Key é seguro após timeout/5xx (doc: concepts/idempotency).
    return request<HfStatusResponse>("POST", `/${path}${qs}`, body, { "Idempotency-Key": opts.idempotencyKey }, 2);
  },
  status(requestId: string) {
    return request<HfStatusResponse>("GET", `/requests/${encodeURIComponent(requestId)}/status`, undefined, undefined, 2);
  },
  async cancel(requestId: string) {
    const res = await fetch(`${BASE}/requests/${encodeURIComponent(requestId)}/cancel`, { method: "POST", headers: headers(), cache: "no-store" });
    if (res.status === 202) return true;
    if (res.status === 400) throw new ApiError(409, "cannot_cancel", "A geração já começou e não pode mais ser cancelada.");
    const t = await res.text().catch(() => "");
    throw translateHfError(res.status, t);
  },
  estimate(path: string, body: Record<string, unknown>) {
    return request<{ type: "estimate"; credits: string; usd: string } | { type: "description"; pricing_description: string }>("POST", `/estimate/${path}`, body);
  },
  models() {
    return request<{ total: number; items: { slug: string }[] }>("GET", "/models");
  },
  soulStyles(version: "v1" | "v2") {
    return request<{ id: string; name: string; description?: string; preview_url?: string }[]>("GET", version === "v2" ? "/v1/text2image/soul-styles/v2" : "/v1/text2image/soul-styles");
  },
  restylePresets() {
    return request<{ items: { id: string; name: string; preview_url?: string }[] }>("GET", "/models/higgsfield/genjutsu/restyle/v1.0/presets");
  },
  marketingPresets(cursor?: number | null) {
    return request<{ total: number; cursor: number | null; items: { id: string; type: string; name: string; cover_image?: { url: string; width: number; height: number }; metadata?: { aspect_ratio?: string; group_name?: string } }[] }>(
      "GET",
      `/marketing-studio/image/presets${cursor ? `?cursor=${cursor}` : ""}`,
    );
  },
  createReference(body: { name: string; model_version: string; input_images: { type: "image_url"; image_url: string }[] }) {
    return request<{ id: string; status: string; thumbnail_url?: string | null; fail_reason?: string | null }>("POST", "/v1/custom-references", body);
  },
  getReference(id: string) {
    return request<{ id: string; name: string; status: string; thumbnail_url?: string | null; fail_reason?: string | null; model_version?: string }>("GET", `/v1/custom-references/${encodeURIComponent(id)}`);
  },
  listReferences(page = 1, pageSize = 50) {
    return request<{ total: number; items: { id: string; name: string; status: string; thumbnail_url?: string | null; model_version?: string }[] }>(
      "GET",
      `/v1/custom-references/list?page=${page}&page_size=${pageSize}`,
    );
  },
};

/** Extrai as URLs de saída de uma resposta concluída. */
export function outputsOf(r: HfStatusResponse): { url: string; kind: "image" | "video" | "audio"; contentType?: string }[] {
  const out: { url: string; kind: "image" | "video" | "audio"; contentType?: string }[] = [];
  for (const i of r.images ?? []) if (i?.url) out.push({ url: i.url, kind: "image", contentType: i.content_type });
  if (r.video?.url) out.push({ url: r.video.url, kind: "video", contentType: r.video.content_type });
  const audios = r.audios?.length ? r.audios : r.audio ? [r.audio] : [];
  for (const a of audios) if (a?.url) out.push({ url: a.url, kind: "audio" });
  return out;
}
