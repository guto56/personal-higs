import { NextResponse } from "next/server";
import { after } from "next/server";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { generations } from "@/lib/db/schema";
import { handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { ingestOutputs, syncGeneration } from "@/lib/server/generations";
import { loadGenerationDTOs } from "@/lib/server/queries";

export const maxDuration = 300;

/** Polling leve em lote: consulta o status das gerações ativas; a cópia dos arquivos roda depois da resposta. */
export const POST = handle(async (req: Request) => {
  await requireSession();
  const { ids } = z.object({ ids: z.array(z.string().uuid()).min(1).max(30) }).parse(await req.json());
  const rows = await db.select().from(generations).where(inArray(generations.id, ids));
  const synced = await Promise.all(rows.map((g) => syncGeneration(g)));
  for (const s of synced) {
    if (s.ingest) {
      const r = s.ingest;
      after(() => ingestOutputs(s.gen.id, r));
    }
  }
  const dtos = await loadGenerationDTOs(synced.map((s) => s.gen));
  return NextResponse.json({ generations: dtos });
});
