import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import { ApiError } from "./errors";

export async function isAuthenticated() {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET);
}

/** Garante sessão válida em rotas de API (defesa em profundidade além do proxy). */
export async function requireSession() {
  if (!(await isAuthenticated())) throw new ApiError(401, "session_expired", "Sua sessão expirou. Entre novamente.");
}
