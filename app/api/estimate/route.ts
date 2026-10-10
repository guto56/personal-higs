import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { assets } from "@/lib/db/schema";
import { getModel } from "@/lib/catalog";
import { buildRequestBody } from "@/lib/catalog/request";
import { hf } from "@/lib/higgsfield/client";
import { ApiError, handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { cached } from "@/lib/server/cache";
import { storage } from "@/lib/server/storage";

// Mídia pública de exemplo para estimar antes do usuário anexar (o preço depende só dos parâmetros).
const SAMPLE = {
  image: "https://cdn.higgsfield.ai/soul-v2-style/c1d13313-1a78-4f55-acd3-125e789d202f.webp",
  video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  audio: "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav",
};

const Body = z.object({
  modelId: z.string(),
  prompt: z.string().max(20_000).default(""),
  params: z.record(z.string(), z.unknown()).default({}),
  inputs: z.record(z.string(), z.array(z.string().uuid())).default({}),
});

export const POST = handle(async (req: Request) => {
  await requireSession();
  const b = Body.parse(await req.json());
  const model = getModel(b.modelId);
  if (!model) throw new ApiError(400, "unknown_model", "Modelo não encontrado.");

  const ids = [...new Set(Object.values(b.inputs).flat())];
  const rows = ids.length ? await db.select().from(assets).where(inArray(assets.id, ids)) : [];
  const signed = await storage.signedUrls(rows.map((r) => r.storagePath), 3600);
  const byId = new Map(rows.map((r) => [r.id, signed.get(r.storagePath)]));
  const inputs: Record<string, string[]> = {};
  for (const slot of model.slots) {
    const urls = (b.inputs[slot.field] ?? []).map((id) => byId.get(id)).filter((u): u is string => !!u);
    inputs[slot.field] = urls.length ? urls : slot.required ? Array(Math.max(1, slot.min)).fill(SAMPLE[slot.kind]) : [];
  }
  const built = buildRequestBody(model, { prompt: b.prompt || "estimate", params: b.params, inputs });
  if (!built.ok) return NextResponse.json({ estimate: null, errors: built.errors });

  const key = `est:${model.path}:${JSON.stringify({ ...built.body, prompt: undefined })}`;
  try {
    const r = await cached(key, 10 * 60_000, () => hf.estimate(model.path, built.body));
    const estimate = r.type === "estimate" ? { type: "credits" as const, credits: Number(r.credits), usd: Number(r.usd) } : { type: "description" as const, text: r.pricing_description };
    return NextResponse.json({ estimate });
  } catch (e) {
    if (e instanceof ApiError && e.code === "no_credits") throw e;
    return NextResponse.json({ estimate: null });
  }
});
