import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;
const g = globalThis as unknown as { __db?: DB };

function getDb(): DB {
  if (!g.__db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Variável de ambiente ausente: DATABASE_URL");
    const sql = postgres(url, { prepare: false, ssl: "require", max: 3, idle_timeout: 20, connect_timeout: 15 });
    g.__db = drizzle({ client: sql, schema });
  }
  return g.__db;
}

/** Conexão preguiçosa: só abre quando usada (evita falha no build sem DATABASE_URL). */
export const db = new Proxy({} as DB, {
  get(_t, prop) {
    const real = getDb();
    const v = Reflect.get(real, prop, real);
    return typeof v === "function" ? v.bind(real) : v;
  },
});
