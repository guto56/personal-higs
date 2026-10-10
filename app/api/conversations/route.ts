import { NextResponse } from "next/server";
import { desc, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, generations } from "@/lib/db/schema";
import { handle } from "@/lib/server/errors";
import { requireSession } from "@/lib/server/auth";

export const GET = handle(async (req: Request) => {
  await requireSession();
  const q = new URL(req.url).searchParams.get("q")?.trim();
  let rows;
  if (q) {
    const like = `%${q.replace(/[%_]/g, "")}%`;
    const hits = await db.selectDistinct({ id: generations.conversationId }).from(generations).where(ilike(generations.prompt, like)).limit(100);
    rows = await db
      .select()
      .from(conversations)
      .where(or(ilike(conversations.title, like), hits.length ? inArray(conversations.id, hits.map((h) => h.id)) : undefined))
      .orderBy(desc(conversations.updatedAt))
      .limit(100);
  } else {
    rows = await db.select().from(conversations).orderBy(desc(conversations.updatedAt)).limit(300);
  }
  return NextResponse.json({
    conversations: rows.map((c) => ({ id: c.id, title: c.title, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() })),
  });
});
