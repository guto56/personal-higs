import { NextResponse, after } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { generations } from "@/lib/db/schema";
import { applyStatus, ingestOutputs } from "@/lib/server/generations";
import type { HfStatusResponse } from "@/lib/higgsfield/client";

export const maxDuration = 300;

const Envelope = z.object({
  request_id: z.string().min(1),
  status: z.enum(["completed", "failed", "nsfw", "canceled", "queued", "in_progress"]),
  error: z.string().nullish(),
  payload: z
    .object({
      images: z.array(z.object({ url: z.string().url(), content_type: z.string().optional() })).optional(),
      video: z.object({ url: z.string().url(), content_type: z.string().optional() }).nullish(),
      audio: z.object({ url: z.string().url() }).nullish(),
    })
    .passthrough()
    .nullish(),
});

function tokenOk(given: string | null) {
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Recebe o resultado final da Higgsfield. Rota pública, autenticada pelo token na URL. */
export async function POST(req: Request) {
  if (!tokenOk(new URL(req.url).searchParams.get("token"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let data: z.infer<typeof Envelope>;
  try {
    data = Envelope.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid envelope" }, { status: 400 });
  }
  const [g] = await db.select().from(generations).where(eq(generations.hfRequestId, data.request_id));
  if (!g) return NextResponse.json({ ok: true }); // desconhecido: confirma para não gerar reenvio
  if (g.status === "completed") return NextResponse.json({ ok: true }); // duplicado

  const r: HfStatusResponse = { status: data.status, request_id: data.request_id, error: data.error, ...(data.payload ?? {}) } as HfStatusResponse;
  const s = await applyStatus(g, r);
  if (s.ingest) {
    const ing = s.ingest;
    after(() => ingestOutputs(g.id, ing));
  }
  return NextResponse.json({ ok: true });
}
