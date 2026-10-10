import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { assets } from "@/lib/db/schema";
import { handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { storage } from "@/lib/server/storage";

/** Ações em lote da Biblioteca: excluir ou favoritar. */
export const POST = handle(async (req: Request) => {
  await requireSession();
  const b = z
    .object({ action: z.enum(["delete", "favorite", "unfavorite"]), ids: z.array(z.string().uuid()).min(1).max(500) })
    .parse(await req.json());
  if (b.action === "delete") {
    const rows = await db.select().from(assets).where(inArray(assets.id, b.ids));
    await db.update(assets).set({ deletedAt: new Date() }).where(inArray(assets.id, b.ids));
    await storage.remove(rows.map((r) => r.storagePath));
  } else {
    await db.update(assets).set({ favorite: b.action === "favorite" }).where(inArray(assets.id, b.ids));
  }
  return NextResponse.json({ ok: true });
});
