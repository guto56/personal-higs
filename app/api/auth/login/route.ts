import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, passwordMatches, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/server/session";
import { ApiError, handle } from "@/lib/server/errors";
import { env } from "@/lib/server/env";

const attempts = new Map<string, { n: number; until: number }>();

export const POST = handle(async (req: Request) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const a = attempts.get(ip);
  if (a && a.until > Date.now() && a.n >= 5) throw new ApiError(429, "too_many_attempts", "Muitas tentativas. Aguarde alguns minutos.");

  const { password } = z.object({ password: z.string().min(1).max(500) }).parse(await req.json());
  if (!passwordMatches(password, env.appPassword)) {
    const cur = a && a.until > Date.now() ? a : { n: 0, until: Date.now() + 10 * 60_000 };
    attempts.set(ip, { n: cur.n + 1, until: cur.until });
    await new Promise((r) => setTimeout(r, 400));
    throw new ApiError(401, "wrong_password", "Senha incorreta.");
  }
  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(env.sessionSecret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
});
