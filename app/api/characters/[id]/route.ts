import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/characters/[id]">) => {
  await requireSession();
  const { id } = await ctx.params;
  const { name } = z.object({ name: z.string().trim().min(1).max(100) }).parse(await req.json());
  await db.update(characters).set({ name }).where(eq(characters.id, id));
  return NextResponse.json({ ok: true });
});

/** Remove o personagem do Studio (a API não documenta exclusão remota). */
export const DELETE = handle(async (_req: Request, ctx: RouteContext<"/api/characters/[id]">) => {
  await requireSession();
  const { id } = await ctx.params;
  await db.delete(characters).where(eq(characters.id, id));
  return NextResponse.json({ ok: true });
});
