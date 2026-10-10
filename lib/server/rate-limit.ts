import "server-only";
import { and, count, gt, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { generations } from "@/lib/db/schema";
import { ApiError } from "./errors";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const MAX_ACTIVE = 8;

/** Limite simples baseado no banco (funciona em serverless, sem estado em memória). */
export async function assertGenerationRateLimit() {
  const since = new Date(Date.now() - WINDOW_MS);
  const [recent] = await db.select({ n: count() }).from(generations).where(gt(generations.createdAt, since));
  if ((recent?.n ?? 0) >= MAX_PER_WINDOW) {
    throw new ApiError(429, "rate_limited", "Muitas gerações em pouco tempo. Aguarde um minuto.");
  }
  const [active] = await db
    .select({ n: count() })
    .from(generations)
    .where(and(gt(generations.createdAt, new Date(Date.now() - 3 * 3600_000)), inArray(generations.status, ["queued", "processing"])));
  if ((active?.n ?? 0) >= MAX_ACTIVE) {
    throw new ApiError(429, "too_many_active", "Já existem muitas gerações em andamento. Espere alguma terminar.");
  }
}
