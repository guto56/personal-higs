import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "studio_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Cria o valor do cookie: base64url(json).assinatura */
export function createSessionToken(secret: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ v: 1, iat: now, exp: now + SESSION_MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined | null, secret: string | undefined, now = Date.now()): boolean {
  if (!token || !secret) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(payload, secret));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp?: number };
    return typeof data.exp === "number" && data.exp > now;
  } catch {
    return false;
  }
}

/** Comparação de senha em tempo constante. */
export function passwordMatches(input: string, expected: string) {
  const a = createHmac("sha256", "pw").update(input).digest();
  const b = createHmac("sha256", "pw").update(expected).digest();
  return timingSafeEqual(a, b);
}
