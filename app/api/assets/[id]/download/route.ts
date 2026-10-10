import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assets } from "@/lib/db/schema";
import { ApiError, handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { storage } from "@/lib/server/storage";

/** Redireciona para uma URL assinada com Content-Disposition de download. */
export const GET = handle(async (_req: Request, ctx: RouteContext<"/api/assets/[id]/download">) => {
  await requireSession();
  const { id } = await ctx.params;
  const [a] = await db.select().from(assets).where(eq(assets.id, id));
  if (!a) throw new ApiError(404, "not_found", "Arquivo não encontrado.");
  const name = a.fileName ?? `studio-${a.id.slice(0, 8)}.${a.storagePath.split(".").pop()}`;
  return NextResponse.redirect(await storage.signedUrl(a.storagePath, 300, name));
});
