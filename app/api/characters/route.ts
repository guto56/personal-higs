import { NextResponse } from "next/server";
import { desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { assets, characters } from "@/lib/db/schema";
import { hf } from "@/lib/higgsfield/client";
import { ApiError, handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { assetsToDTO } from "@/lib/server/dto";
import { storage } from "@/lib/server/storage";
import { eq } from "drizzle-orm";

const TERMINAL = ["completed", "failed"];

/** Lista personagens; atualiza o status dos que ainda estão treinando. */
export const GET = handle(async () => {
  await requireSession();
  let rows = await db.select().from(characters).orderBy(desc(characters.createdAt));
  const pending = rows.filter((r) => r.hfReferenceId && !TERMINAL.includes(r.status));
  if (pending.length) {
    await Promise.all(
      pending.map(async (r) => {
        try {
          const ref = await hf.getReference(r.hfReferenceId!);
          if (ref.status !== r.status) await db.update(characters).set({ status: ref.status, error: ref.fail_reason ?? null }).where(eq(characters.id, r.id));
        } catch {
          /* tenta de novo na próxima listagem */
        }
      }),
    );
    rows = await db.select().from(characters).orderBy(desc(characters.createdAt));
  }
  const thumbIds = rows.map((r) => r.thumbnailAssetId ?? r.inputAssetIds[0]).filter((x): x is string => !!x);
  const thumbs = thumbIds.length ? await assetsToDTO(await db.select().from(assets).where(inArray(assets.id, thumbIds))) : [];
  const byId = new Map(thumbs.map((t) => [t.id, t.url]));
  return NextResponse.json({
    characters: rows.map((r) => ({
      id: r.id,
      referenceId: r.hfReferenceId,
      name: r.name,
      version: r.modelVersion,
      status: r.status,
      error: r.error,
      images: r.inputAssetIds.length,
      thumbnail: byId.get(r.thumbnailAssetId ?? r.inputAssetIds[0] ?? "") ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

const Body = z.object({
  name: z.string().trim().min(1).max(100),
  version: z.enum(["v1", "v2", "cinema"]).default("v2"),
  assetIds: z.array(z.string().uuid()).min(1).max(100),
});

/** Treina um novo personagem (POST /v1/custom-references). */
export const POST = handle(async (req: Request) => {
  await requireSession();
  const b = Body.parse(await req.json());
  const rows = await db.select().from(assets).where(inArray(assets.id, b.assetIds));
  if (rows.length !== b.assetIds.length || rows.some((r) => !r.uploaded || r.kind !== "image")) {
    throw new ApiError(400, "bad_assets", "Use apenas imagens que terminaram de enviar.");
  }
  const signed = await storage.signedUrls(rows.map((r) => r.storagePath), 60 * 60 * 24);
  const ref = await hf.createReference({
    name: b.name,
    model_version: b.version,
    input_images: rows.map((r) => ({ type: "image_url" as const, image_url: signed.get(r.storagePath)! })),
  });
  const [c] = await db
    .insert(characters)
    .values({ name: b.name, modelVersion: b.version, hfReferenceId: ref.id, status: ref.status, inputAssetIds: b.assetIds, thumbnailAssetId: b.assetIds[0] })
    .returning();
  return NextResponse.json({ character: { id: c.id, referenceId: c.hfReferenceId, status: c.status } });
});
