import { NextResponse, after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assets, generations } from "@/lib/db/schema";
import { ApiError, handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { ingestOutputs, syncGeneration } from "@/lib/server/generations";
import { loadGenerationDTOs } from "@/lib/server/queries";
import { storage } from "@/lib/server/storage";

export const maxDuration = 300;

export const GET = handle(async (_req: Request, ctx: RouteContext<"/api/generations/[id]">) => {
  await requireSession();
  const { id } = await ctx.params;
  const [g] = await db.select().from(generations).where(eq(generations.id, id));
  if (!g) throw new ApiError(404, "not_found", "Geração não encontrada.");
  const s = await syncGeneration(g);
  if (s.ingest) {
    const r = s.ingest;
    after(() => ingestOutputs(s.gen.id, r));
  }
  const [dto] = await loadGenerationDTOs([s.gen]);
  // Cadeia de origem: gerações ancestrais.
  const chain = [];
  let parentId = s.gen.parentGenerationId;
  for (let i = 0; parentId && i < 10; i++) {
    const [p] = await db.select().from(generations).where(eq(generations.id, parentId));
    if (!p) break;
    chain.push(p);
    parentId = p.parentGenerationId;
  }
  const chainDtos = await loadGenerationDTOs(chain);
  const children = await db.select().from(generations).where(eq(generations.parentGenerationId, id));
  const childDtos = await loadGenerationDTOs(children);
  return NextResponse.json({ generation: dto, chain: chainDtos, children: childDtos });
});

export const DELETE = handle(async (_req: Request, ctx: RouteContext<"/api/generations/[id]">) => {
  await requireSession();
  const { id } = await ctx.params;
  const outs = await db.select().from(assets).where(eq(assets.generationId, id));
  await db.delete(assets).where(eq(assets.generationId, id));
  await db.delete(generations).where(eq(generations.id, id));
  await storage.remove(outs.map((a) => a.storagePath));
  return NextResponse.json({ ok: true });
});
