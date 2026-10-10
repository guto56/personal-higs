import { NextResponse } from "next/server";
import { hf } from "@/lib/higgsfield/client";
import { handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { cached } from "@/lib/server/cache";

export const GET = handle(async (req: Request) => {
  await requireSession();
  const version = new URL(req.url).searchParams.get("version") === "v2" ? "v2" : "v1";
  const items = await cached(`styles:${version}`, 60 * 60_000, () => hf.soulStyles(version));
  return NextResponse.json({ items: items.map((s) => ({ id: s.id, name: s.name, description: s.description ?? "", preview: s.preview_url ?? null })) });
});
