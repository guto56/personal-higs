import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { createGeneration } from "@/lib/server/generations";
import { loadGenerationDTOs } from "@/lib/server/queries";

const Body = z.object({
  conversationId: z.string().uuid().nullish(),
  modelId: z.string().min(1).max(200),
  mode: z.enum(["image", "video", "audio", "edit", "apps"]),
  subtype: z.string().min(1).max(50),
  prompt: z.string().max(20_000).default(""),
  negativePrompt: z.string().max(5_000).nullish(),
  params: z.record(z.string(), z.unknown()).default({}),
  inputs: z.record(z.string(), z.array(z.string().uuid()).max(50)).default({}),
  parentGenerationId: z.string().uuid().nullish(),
  parentAssetId: z.string().uuid().nullish(),
  chainAction: z.string().max(50).nullish(),
});

export const POST = handle(async (req: Request) => {
  await requireSession();
  const body = Body.parse(await req.json());
  const gen = await createGeneration(body);
  const [dto] = await loadGenerationDTOs([gen]);
  return NextResponse.json({ generation: dto });
});
