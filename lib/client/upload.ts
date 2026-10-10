"use client";

import type { MediaKind, SlotDef } from "@/lib/catalog";
import type { AssetDTO } from "@/lib/types";
import { api, ClientApiError } from "./api";
import { useComposer, type Attachment } from "./composer-store";

const ACCEPT: Record<MediaKind, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  audio: ["audio/wav", "audio/x-wav", "audio/wave", "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a"],
};
const MAX_MB: Record<MediaKind, number> = { image: 30, video: 500, audio: 100 };

export const acceptFor = (kind: MediaKind) => ACCEPT[kind].join(",");

export function kindOfFile(f: File): MediaKind | null {
  if (f.type.startsWith("image/")) return "image";
  if (f.type.startsWith("video/")) return "video";
  if (f.type.startsWith("audio/")) return "audio";
  return null;
}

function readMeta(file: File, url: string, kind: MediaKind): Promise<{ width?: number; height?: number; duration?: number }> {
  return new Promise((resolve) => {
    if (kind === "image") {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({});
      img.src = url;
      return;
    }
    const el = document.createElement(kind === "video" ? "video" : "audio");
    el.preload = "metadata";
    el.onloadedmetadata = () =>
      resolve({
        duration: isFinite(el.duration) ? el.duration : undefined,
        width: (el as HTMLVideoElement).videoWidth || undefined,
        height: (el as HTMLVideoElement).videoHeight || undefined,
      });
    el.onerror = () => resolve({});
    el.src = url;
  });
}

/** Valida contra o slot antes de enviar. Retorna mensagem de erro ou null. */
export function validateFor(slot: SlotDef, file: File, meta: { duration?: number }): string | null {
  const kind = kindOfFile(file);
  if (kind !== slot.kind) return `${slot.label} aceita apenas ${slot.kind === "image" ? "imagens" : slot.kind === "video" ? "vídeos" : "áudios"}.`;
  if (!ACCEPT[kind].includes(file.type)) return `Formato ${file.type || "desconhecido"} não suportado.`;
  if (file.size > MAX_MB[kind] * 1024 * 1024) return `Arquivo acima de ${MAX_MB[kind]} MB.`;
  if (kind === "video" && slot.hint?.includes("4 segundos") && meta.duration !== undefined && meta.duration < 4) return "O vídeo precisa ter pelo menos 4 segundos.";
  return null;
}

export function putWithProgress(url: string, file: File, headers: Record<string, string>, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

/** Envia direto do navegador para o Storage (URL assinada), sem passar pela função da Vercel. */
export async function uploadToSlot(file: File, slot: SlotDef) {
  const store = useComposer.getState();
  const localId = crypto.randomUUID();
  const kind = kindOfFile(file) ?? slot.kind;
  const previewUrl = URL.createObjectURL(file);
  const meta = await readMeta(file, previewUrl, kind);
  const error = validateFor(slot, file, meta);
  const base: Attachment = {
    localId,
    field: slot.field,
    kind,
    status: error ? "error" : "uploading",
    progress: 0,
    previewUrl,
    fileName: file.name,
    size: file.size,
    duration: meta.duration ?? null,
    width: meta.width ?? null,
    height: meta.height ?? null,
    error: error ?? undefined,
  };
  store.addAttachment(base);
  if (error) return;
  try {
    const { assetId, uploadUrl, uploadHeaders } = await api<{ assetId: string; uploadUrl: string; uploadHeaders: Record<string, string> }>("/api/uploads", {
      method: "POST",
      json: { fileName: file.name, mime: file.type, size: file.size, kind, width: meta.width, height: meta.height, duration: meta.duration },
    });
    await putWithProgress(uploadUrl, file, uploadHeaders, (p) => useComposer.getState().updateAttachment(localId, { progress: p }));
    await api<{ asset: AssetDTO }>(`/api/uploads/${assetId}/complete`, { method: "POST" });
    useComposer.getState().updateAttachment(localId, { status: "ready", progress: 1, assetId });
  } catch (e) {
    useComposer.getState().updateAttachment(localId, { status: "error", error: e instanceof ClientApiError ? e.message : "Falha no envio. Tente de novo." });
  }
}

/** Anexa um arquivo que já existe (Biblioteca ou saída de geração). */
export function attachExisting(asset: Pick<AssetDTO, "id" | "kind" | "url" | "fileName" | "width" | "height" | "duration">, field: string) {
  useComposer.getState().addAttachment({
    localId: crypto.randomUUID(),
    field,
    kind: asset.kind,
    status: "ready",
    progress: 1,
    assetId: asset.id,
    previewUrl: asset.url,
    fileName: asset.fileName ?? "arquivo",
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
  });
}
