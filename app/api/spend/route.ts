import { NextResponse } from "next/server";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { generations } from "@/lib/db/schema";
import { handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";

/** Créditos gastos (estimativas das gerações concluídas). A API não expõe saldo. */
export const GET = handle(async () => {
  await requireSession();
  const since = new Date(Date.now() - 30 * 86400_000);
  const [r] = await db
    .select({
      credits: sql<string>`coalesce(sum((${generations.estimate}->>'credits')::numeric), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(generations)
    .where(and(eq(generations.status, "completed"), gt(generations.createdAt, since)));
  const [last] = await db
    .select({ error: generations.error })
    .from(generations)
    .where(eq(generations.status, "failed"))
    .orderBy(sql`${generations.createdAt} desc`)
    .limit(1);
  return NextResponse.json({ credits30d: Number(r?.credits ?? 0), generations30d: r?.count ?? 0, noCredits: !!last?.error?.includes("Créditos insuficientes") });
});
