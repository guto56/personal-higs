import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { assets } from "@/lib/db/schema";
import { ApiError, handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { extFor, MEDIA_LIMITS, storage } from "@/lib/server/storage";

const Body = z.object({
  fileName: z.string().max(300),
  mime: z.string().max(100),
  size: z.number().int().positive(),
  kind: z.enum(["image", "video", "audio"]),
  width: z.number().int().positive().nullish(),
  height: z.number().int().positive().nullish(),
  duration: z.number().positive().nullish(),
});

/** Cria o registro do anexo e devolve uma URL assinada para o navegador enviar direto ao Storage. */
export const POST = handle(async (req: Request) => {
  await requireSession();
  const b = Body.parse(await req.json());
  const limits = MEDIA_LIMITS[b.kind];
  if (!(limits.mimes as readonly string[]).includes(b.mime)) throw new ApiError(400, "bad_type", "Formato de arquivo não suportado para este anexo.");
  if (b.size > limits.maxBytes) throw new ApiError(400, "too_big", `Arquivo grande demais (máximo ${Math.round(limits.maxBytes / 1024 / 1024)} MB).`);
  const id = crypto.randomUUID();
  const path = `uploads/${new Date().toISOString().slice(0, 7)}/${id}.${extFor(b.mime)}`;
  await db.insert(assets).values({
    id,
    kind: b.kind,
    source: "upload",
    storagePath: path,
    mime: b.mime,
    size: b.size,
    width: b.width ?? null,
    height: b.height ?? null,
    duration: b.duration ?? null,
    fileName: b.fileName,
    uploaded: false,
  });
  const uploadUrl = await storage.signedUpload(path);
  return NextResponse.json({ assetId: id, uploadUrl });
});
