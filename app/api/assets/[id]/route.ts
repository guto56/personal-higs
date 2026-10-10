import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { assets } from "@/lib/db/schema";
import { handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/assets/[id]">) => {
  await requireSession();
  const { id } = await ctx.params;
  const { favorite } = z.object({ favorite: z.boolean() }).parse(await req.json());
  await db.update(assets).set({ favorite }).where(eq(assets.id, id));
  return NextResponse.json({ ok: true });
});
