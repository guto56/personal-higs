import { NextResponse } from "next/server";
import { hf } from "@/lib/higgsfield/client";
import { handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";
import { cached } from "@/lib/server/cache";

type Preset = { id: string; name: string; preview: string | null; group: string | null; aspectRatio: string | null; width?: number; height?: number };

async function marketing(): Promise<Preset[]> {
  const all: Preset[] = [];
  let cursor: number | null = null;
  for (let i = 0; i < 10; i++) {
    const r = await hf.marketingPresets(cursor);
    for (const p of r.items)
      all.push({ id: p.id, name: p.name, preview: p.cover_image?.url ?? null, group: p.metadata?.group_name ?? p.type, aspectRatio: p.metadata?.aspect_ratio ?? null, width: p.cover_image?.width, height: p.cover_image?.height });
    if (!r.cursor || all.length >= r.total) break;
    cursor = r.cursor;
  }
  return all;
}

export const GET = handle(async (req: Request) => {
  await requireSession();
  const source = new URL(req.url).searchParams.get("source");
  if (source === "marketing-studio") return NextResponse.json({ items: await cached("presets:marketing", 60 * 60_000, marketing) });
  const r = await cached("presets:restyle", 60 * 60_000, () => hf.restylePresets());
  return NextResponse.json({ items: r.items.map((p) => ({ id: p.id, name: p.name, preview: p.preview_url ?? null, group: null, aspectRatio: null })) });
});
