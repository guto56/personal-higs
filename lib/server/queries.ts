import "server-only";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { assets, generations, type Generation } from "@/lib/db/schema";
import { generationsToDTO } from "./dto";

/** Carrega gerações com anexos e saídas e devolve DTOs com URLs assinadas. */
export async function loadGenerationDTOs(list: Generation[]) {
  if (list.length === 0) return [];
  const genIds = list.map((g) => g.id);
  const inputIds = [...new Set(list.flatMap((g) => Object.values(g.inputs).flat().map((r) => r.assetId)))];
  const [outs, ins] = await Promise.all([
    db.select().from(assets).where(and(inArray(assets.generationId, genIds), isNull(assets.deletedAt))),
    inputIds.length ? db.select().from(assets).where(inArray(assets.id, inputIds)) : Promise.resolve([]),
  ]);
  const all = new Map([...outs, ...ins].map((a) => [a.id, a]));
  return generationsToDTO(list, [...all.values()]);
}

export async function conversationGenerations(conversationId: string) {
  return db.select().from(generations).where(eq(generations.conversationId, conversationId)).orderBy(generations.createdAt);
}

export async function recentGenerations(limit = 50) {
  return db.select().from(generations).orderBy(desc(generations.createdAt)).limit(limit);
}
