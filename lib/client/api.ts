"use client";

export class ClientApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

/** fetch para as rotas internas: JSON, erros em PT-BR e sessão expirada leva ao login. */
export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { ...(init?.json !== undefined ? { "Content-Type": "application/json" } : {}), ...init?.headers },
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    });
  } catch {
    throw new ClientApiError(0, "offline", "Sem conexão. Verifique a internet e tente de novo.");
  }
  const data = (await res.json().catch(() => null)) as { error?: { code: string; message: string; details?: unknown } } | null;
  if (!res.ok) {
    if (res.status === 401 && data?.error?.code === "session_expired" && typeof window !== "undefined") {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      // Recarrega por completo para limpar o estado da sessão.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/login?expired=1&next=${next}`;
    }
    throw new ClientApiError(res.status, data?.error?.code ?? "error", data?.error?.message ?? "Algo deu errado. Tente de novo.", data?.error?.details);
  }
  return data as T;
}
