import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: SupabaseClient | null = null;

function sb() {
  if (!client) client = createClient(env.supabaseUrl, env.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export const MEDIA_LIMITS = {
  image: { maxBytes: 30 * 1024 * 1024, mimes: ["image/jpeg", "image/png", "image/webp", "image/gif"] },
  video: { maxBytes: 500 * 1024 * 1024, mimes: ["video/mp4", "video/quicktime", "video/webm"] },
  audio: { maxBytes: 100 * 1024 * 1024, mimes: ["audio/wav", "audio/x-wav", "audio/wave", "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a"] },
} as const;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
};

export function extFor(mime: string, fallbackUrl?: string) {
  if (EXT[mime]) return EXT[mime];
  const m = fallbackUrl && /\.([a-z0-9]{2,4})(?:\?|$)/i.exec(fallbackUrl);
  return m ? m[1].toLowerCase() : "bin";
}

export const storage = {
  /** URL assinada para o navegador enviar o arquivo direto ao Storage (sem passar pela Vercel). */
  async signedUpload(path: string) {
    const { data, error } = await sb().storage.from(env.bucket).createSignedUploadUrl(path, { upsert: true });
    if (error || !data) throw new Error(`storage.signedUpload: ${error?.message}`);
    return data.signedUrl;
  },
  async signedUrl(path: string, expiresIn = 60 * 60 * 6, download?: string) {
    const { data, error } = await sb().storage.from(env.bucket).createSignedUrl(path, expiresIn, download ? { download } : undefined);
    if (error || !data) throw new Error(`storage.signedUrl: ${error?.message}`);
    return data.signedUrl;
  },
  async signedUrls(paths: string[], expiresIn = 60 * 60 * 6) {
    if (paths.length === 0) return new Map<string, string>();
    const { data, error } = await sb().storage.from(env.bucket).createSignedUrls(paths, expiresIn);
    if (error || !data) throw new Error(`storage.signedUrls: ${error?.message}`);
    return new Map(data.filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl]));
  },
  /** Envia um corpo em streaming (resultados grandes não ficam inteiros em memória). */
  async uploadStream(path: string, body: ReadableStream<Uint8Array> | Uint8Array, contentType: string, size?: number) {
    const signed = await this.signedUpload(path);
    const headers: Record<string, string> = { "content-type": contentType, "x-upsert": "true" };
    if (size) headers["content-length"] = String(size);
    const res = await fetch(signed, { method: "PUT", headers, body, duplex: "half" } as RequestInit & { duplex: "half" });
    if (!res.ok) throw new Error(`storage.uploadStream ${res.status}: ${(await res.text()).slice(0, 200)}`);
  },
  async info(path: string) {
    const dir = path.split("/").slice(0, -1).join("/");
    const name = path.split("/").pop()!;
    const { data } = await sb().storage.from(env.bucket).list(dir, { search: name, limit: 1 });
    const f = data?.find((d) => d.name === name);
    return f ? { size: (f.metadata as { size?: number } | null)?.size ?? null, mime: (f.metadata as { mimetype?: string } | null)?.mimetype ?? null } : null;
  },
  async remove(paths: string[]) {
    if (paths.length === 0) return;
    await sb().storage.from(env.bucket).remove(paths);
  },
};
