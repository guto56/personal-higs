import "server-only";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

export const env = {
  get hfKeyId() {
    return required("HIGGSFIELD_API_KEY_ID");
  },
  get hfKeySecret() {
    return required("HIGGSFIELD_API_KEY_SECRET");
  },
  get supabaseUrl() {
    return required("SUPABASE_URL");
  },
  get supabaseKey() {
    return required("SUPABASE_SERVER_KEY");
  },
  get bucket() {
    return process.env.SUPABASE_BUCKET || "studio";
  },
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get appPassword() {
    return required("APP_PASSWORD");
  },
  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  get webhookSecret() {
    return process.env.WEBHOOK_SECRET || "";
  },
  /** URL pública https usada no webhook. Vazio em desenvolvimento local. */
  get publicUrl(): string | null {
    const explicit = process.env.APP_URL;
    if (explicit) return explicit.replace(/\/$/, "");
    const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (process.env.VERCEL_ENV === "production" && prod) return `https://${prod}`;
    const url = process.env.VERCEL_URL;
    if (url) return `https://${url}`;
    return null;
  },
};
