import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { generations } from "@/lib/db/schema";
import { ApiError, handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { hf } from "@/lib/higgsfield/client";

export const POST = handle(async (_req: Request, ctx: RouteContext<"/api/generations/[id]/cancel">) => {
  await requireSession();
  const { id } = await ctx.params;
  const [g] = await db.select().from(generations).where(eq(generations.id, id));
  if (!g) throw new ApiError(404, "not_found", "Geração não encontrada.");
  if (g.status !== "queued" || !g.hfRequestId) throw new ApiError(409, "cannot_cancel", "Só dá para cancelar enquanto está na fila.");
  await hf.cancel(g.hfRequestId);
  await db.update(generations).set({ status: "canceled", error: "Geração cancelada.", completedAt: new Date() }).where(eq(generations.id, id));
  return NextResponse.json({ ok: true });
});
