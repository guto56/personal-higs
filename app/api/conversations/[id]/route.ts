import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { assets, conversations, generations } from "@/lib/db/schema";
import { ApiError, handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { conversationGenerations, loadGenerationDTOs } from "@/lib/server/queries";
import { storage } from "@/lib/server/storage";

export const GET = handle(async (_req: Request, ctx: RouteContext<"/api/conversations/[id]">) => {
  await requireSession();
  const { id } = await ctx.params;
  const [c] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!c) throw new ApiError(404, "not_found", "Conversa não encontrada.");
  const gens = await loadGenerationDTOs(await conversationGenerations(id));
  return NextResponse.json({
    conversation: { id: c.id, title: c.title, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() },
    generations: gens,
  });
});

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/conversations/[id]">) => {
  await requireSession();
  const { id } = await ctx.params;
  const { title } = z.object({ title: z.string().trim().min(1).max(120) }).parse(await req.json());
  await db.update(conversations).set({ title }).where(eq(conversations.id, id));
  return NextResponse.json({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: RouteContext<"/api/conversations/[id]">) => {
  await requireSession();
  const { id } = await ctx.params;
  const gens = await db.select({ id: generations.id }).from(generations).where(eq(generations.conversationId, id));
  if (gens.length) {
    const outs = await db.select().from(assets).where(inArray(assets.generationId, gens.map((g) => g.id)));
    await db.delete(assets).where(inArray(assets.generationId, gens.map((g) => g.id)));
    await storage.remove(outs.map((a) => a.storagePath));
  }
  await db.delete(conversations).where(eq(conversations.id, id));
  return NextResponse.json({ ok: true });
});
