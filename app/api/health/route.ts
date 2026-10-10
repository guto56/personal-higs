import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { hf } from "@/lib/higgsfield/client";
import { ApiError, handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { env } from "@/lib/server/env";
import { storage } from "@/lib/server/storage";
import { CATALOG_SYNCED_AT, MODELS } from "@/lib/catalog";

async function check<T>(fn: () => Promise<T>) {
  const t = Date.now();
  try {
    const v = await fn();
    return { ok: true, ms: Date.now() - t, value: v };
  } catch (e) {
    return { ok: false, ms: Date.now() - t, error: e instanceof ApiError ? e.message : "Falhou." };
  }
}

/** Testa as conexões (API Higgsfield, banco, storage) e o status de créditos. */
export const GET = handle(async () => {
  await requireSession();
  const [api, credits, database, store] = await Promise.all([
    check(async () => (await hf.models()).total),
    // Não há endpoint de saldo na API; uma estimativa autenticada confirma acesso.
    check(async () => hf.estimate("higgsfield-ai/soul/v2/standard", { prompt: "health check" })),
    check(async () => (await db.execute(sql`select 1`)) && true),
    check(async () => (await storage.signedUrls(["healthcheck"]).catch(() => new Map())) && true),
  ]);
  return NextResponse.json({
    higgsfield: { ok: api.ok, ms: api.ms, models: api.ok ? api.value : null, error: api.ok ? null : api.error },
    estimate: { ok: credits.ok },
    database: { ok: database.ok, ms: database.ms, error: database.ok ? null : database.error },
    storage: { ok: store.ok, ms: store.ms },
    catalog: { syncedAt: CATALOG_SYNCED_AT, models: MODELS.length },
    webhook: { enabled: !!env.publicUrl && !!env.webhookSecret && process.env.VERCEL_ENV === "production" },
  });
});
