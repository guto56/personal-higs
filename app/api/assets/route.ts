import { NextResponse } from "next/server";
import { and, desc, eq, ilike, inArray, isNull, lt, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { assets, generations } from "@/lib/db/schema";
import { handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { assetsToDTO } from "@/lib/server/dto";

const PAGE = 60;

/** Biblioteca: tudo que foi gerado, com filtros e paginação por cursor. */
export const GET = handle(async (req: Request) => {
  await requireSession();
  const sp = new URL(req.url).searchParams;
  const where: SQL[] = [isNull(assets.deletedAt), eq(assets.uploaded, true)];
  const source = sp.get("source") ?? "generation";
  if (source === "generation" || source === "upload") where.push(eq(assets.source, source));
  const kind = sp.get("kind");
  if (kind === "image" || kind === "video" || kind === "audio") where.push(eq(assets.kind, kind));
  if (sp.get("favorites") === "1") where.push(eq(assets.favorite, true));
  const cursor = sp.get("cursor");
  if (cursor) where.push(lt(assets.createdAt, new Date(cursor)));
  const model = sp.get("model");
  const q = sp.get("q")?.trim();
  if (model || q) {
    const cond: SQL[] = [];
    if (model) cond.push(eq(generations.modelId, model));
    if (q) cond.push(ilike(generations.prompt, `%${q.replace(/[%_]/g, "")}%`));
    const gens = await db.select({ id: generations.id }).from(generations).where(and(...cond)).limit(2000);
    if (gens.length === 0) return NextResponse.json({ assets: [], generations: {}, nextCursor: null });
    where.push(inArray(assets.generationId, gens.map((g) => g.id)));
  }
  const rows = await db.select().from(assets).where(and(...where)).orderBy(desc(assets.createdAt)).limit(PAGE);
  const genIds = [...new Set(rows.map((r) => r.generationId).filter((x): x is string => !!x))];
  const gens = genIds.length
    ? await db
        .select({ id: generations.id, prompt: generations.prompt, modelId: generations.modelId, conversationId: generations.conversationId, params: generations.params })
        .from(generations)
        .where(inArray(generations.id, genIds))
    : [];
  return NextResponse.json({
    assets: await assetsToDTO(rows),
    generations: Object.fromEntries(gens.map((g) => [g.id, g])),
    nextCursor: rows.length === PAGE ? rows[rows.length - 1].createdAt.toISOString() : null,
  });
});
