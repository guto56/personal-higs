import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assets } from "@/lib/db/schema";
import { ApiError, handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { assetsToDTO } from "@/lib/server/dto";
import { storage } from "@/lib/server/storage";

/** Confirma que o arquivo chegou ao Storage. */
export const POST = handle(async (_req: Request, ctx: RouteContext<"/api/uploads/[id]/complete">) => {
  await requireSession();
  const { id } = await ctx.params;
  const [a] = await db.select().from(assets).where(eq(assets.id, id));
  if (!a) throw new ApiError(404, "not_found", "Anexo não encontrado.");
  const info = await storage.info(a.storagePath);
  if (!info) throw new ApiError(400, "upload_missing", "O arquivo não chegou ao armazenamento. Tente enviar de novo.");
  const [u] = await db.update(assets).set({ uploaded: true, size: info.size ?? a.size }).where(eq(assets.id, id)).returning();
  const [dto] = await assetsToDTO([u]);
  return NextResponse.json({ asset: dto });
});
