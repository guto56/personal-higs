import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";

const KEYS = ["defaultModels", "lastConfig"] as const;

export const GET = handle(async () => {
  await requireSession();
  const rows = await db.select().from(settings);
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

export const PUT = handle(async (req: Request) => {
  await requireSession();
  const b = z.object({ key: z.enum(KEYS), value: z.unknown() }).parse(await req.json());
  await db
    .insert(settings)
    .values({ key: b.key, value: b.value ?? null })
    .onConflictDoUpdate({ target: settings.key, set: { value: b.value ?? null, updatedAt: new Date() } });
  return NextResponse.json({ ok: true });
});
