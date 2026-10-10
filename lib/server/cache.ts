import "server-only";

const store = new Map<string, { at: number; value: unknown }>();

/** Cache em memória por instância (suficiente para catálogos que mudam pouco). */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await fn();
  store.set(key, { at: Date.now(), value });
  return value;
}
