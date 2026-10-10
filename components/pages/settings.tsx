"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CircleCheck, CircleX, ExternalLink, Loader2, LogOut, Monitor, Moon, RefreshCw, Sun } from "lucide-react";
import { cn, formatCredits } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { MODES, modelsFor } from "@/lib/catalog";
import { useComposer } from "@/lib/client/composer-store";
import { getThemePref, setTheme } from "@/lib/client/ui-store";
import type { GenerationDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./page-header";

type Health = {
  higgsfield: { ok: boolean; ms: number; models: number | null; error: string | null };
  estimate: { ok: boolean };
  database: { ok: boolean; ms: number; error: string | null };
  storage: { ok: boolean; ms: number };
  catalog: { syncedAt: string; models: number };
  webhook: { enabled: boolean };
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-border py-6 md:grid-cols-[240px_1fr] md:gap-8">
      <div>
        <h2 className="text-sm font-medium text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Status({ ok, label, detail }: { ok: boolean | undefined; label: string; detail?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-sm">
      {ok === undefined ? <Loader2 className="size-4 animate-spin text-fg-subtle" /> : ok ? <CircleCheck className="size-4 text-success" strokeWidth={1.75} /> : <CircleX className="size-4 text-danger" strokeWidth={1.75} />}
      <span className="text-fg">{label}</span>
      {detail && <span className="ml-auto truncate font-mono text-2xs text-fg-subtle">{detail}</span>}
    </div>
  );
}

export function SettingsPage() {
  const health = useQuery({ queryKey: ["health"], queryFn: () => api<Health>("/api/health"), staleTime: 0 });
  const spend = useQuery({ queryKey: ["spend"], queryFn: () => api<{ credits30d: number; generations30d: number; noCredits: boolean }>("/api/spend") });
  const history = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const r = await api<{ conversations: { id: string }[] }>("/api/conversations");
      const recent = await Promise.all(r.conversations.slice(0, 8).map((c) => api<{ generations: GenerationDTO[] }>(`/api/conversations/${c.id}`)));
      return recent
        .flatMap((x) => x.generations)
        .filter((g) => g.estimate?.credits != null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 15);
    },
  });
  const [theme, setThemeState] = useState<"system" | "light" | "dark">(() => (typeof window === "undefined" ? "system" : getThemePref()));
  const modelBySub = useComposer((s) => s.modelBySub);

  function setDefault(mode: string, sub: string, id: string) {
    const next = { ...useComposer.getState().modelBySub, [`${mode}/${sub}`]: id };
    useComposer.setState({ modelBySub: next });
    api("/api/settings", { method: "PUT", json: { key: "defaultModels", value: next } }).catch(() => {});
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    // Recarga completa para descartar caches da sessão.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }

  const h = health.data;
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <PageHeader title="Configurações" className="px-0 sm:px-0" />
        <div className="px-0 sm:px-0">
          <Section title="Conexão" description="Teste das conexões usadas pelo servidor.">
            <div className="flex flex-col divide-y divide-border rounded-lg border border-border px-3">
              <Status ok={h?.higgsfield.ok} label="API Higgsfield" detail={h?.higgsfield.ok ? `${h.higgsfield.models} modelos · ${h.higgsfield.ms}ms` : h?.higgsfield.error} />
              <Status ok={h?.database.ok} label="Banco de dados" detail={h?.database.ok ? `${h.database.ms}ms` : h?.database.error} />
              <Status ok={h?.storage.ok} label="Armazenamento" detail={h ? `${h.storage.ms}ms` : undefined} />
              <Status ok={h ? h.webhook.enabled : undefined} label="Webhook" detail={h ? (h.webhook.enabled ? "ativo em produção" : "polling (sem webhook)") : undefined} />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Button size="sm" variant="secondary" onClick={() => health.refetch()} disabled={health.isFetching}>
                <RefreshCw className={cn(health.isFetching && "animate-spin")} strokeWidth={1.75} /> Testar de novo
              </Button>
              {h && <span className="text-2xs text-fg-subtle">Catálogo: {h.catalog.models} modelos, sincronizado em {new Date(h.catalog.syncedAt).toLocaleDateString("pt-BR")}</span>}
            </div>
          </Section>

          <Section title="Créditos" description="A API da Higgsfield não expõe o saldo; veja e recarregue no console.">
            <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
              <div>
                <p className="text-2xs text-fg-subtle">Gasto nos últimos 30 dias</p>
                <p className="font-mono text-xl tabular">{spend.data ? `${formatCredits(spend.data.credits30d)} cr` : "..."}</p>
              </div>
              <div>
                <p className="text-2xs text-fg-subtle">Gerações concluídas</p>
                <p className="font-mono text-xl tabular">{spend.data?.generations30d ?? "..."}</p>
              </div>
              {spend.data?.noCredits && <p className="text-sm text-danger">A última tentativa falhou por falta de créditos.</p>}
            </div>
            <a href="https://console.higgsfield.ai" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
              Abrir console da Higgsfield <ExternalLink className="size-3.5" strokeWidth={1.75} />
            </a>
            <div className="mt-5">
              <p className="mb-1 text-2xs text-fg-subtle">Histórico recente</p>
              {history.isLoading && <div className="shimmer h-20 rounded-lg" />}
              {history.data && history.data.length === 0 && <p className="text-sm text-fg-muted">Sem gerações cobradas ainda.</p>}
              {history.data && history.data.length > 0 && (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {history.data.map((g) => (
                    <li key={g.id}>
                      <Link href={`/g/${g.id}`} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-surface-1">
                        <span className="w-24 shrink-0 font-mono text-2xs text-fg-subtle">{new Date(g.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="min-w-0 flex-1 truncate text-fg-muted">{g.prompt || g.modelId}</span>
                        <span className={cn("shrink-0 font-mono text-2xs", g.status === "completed" ? "text-fg" : "text-fg-subtle line-through")}>{formatCredits(g.estimate!.credits!)} cr</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Section>

          <Section title="Modelos padrão" description="Modelo escolhido ao abrir cada tipo. Também muda quando você troca no composer.">
            <div className="grid gap-2 sm:grid-cols-2">
              {MODES.flatMap((m) =>
                m.subtypes.map((s) => {
                  const list = modelsFor(m.id, s.id);
                  const value = list.some((x) => x.id === modelBySub[`${m.id}/${s.id}`]) ? modelBySub[`${m.id}/${s.id}`] : s.defaultModel;
                  return (
                    <label key={`${m.id}/${s.id}`} className="flex flex-col gap-1">
                      <span className="text-2xs text-fg-subtle">
                        {m.label} / {s.label}
                      </span>
                      <select value={value} onChange={(e) => setDefault(m.id, s.id, e.target.value)} className="h-8 rounded-md border border-border bg-surface-1 px-2 text-sm text-fg outline-none focus-visible:border-accent">
                        {list.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }),
              )}
            </div>
          </Section>

          <Section title="Aparência">
            <div role="radiogroup" aria-label="Tema" className="flex w-fit gap-0.5 rounded-lg bg-surface-2 p-0.5">
              {(
                [
                  { id: "system", label: "Sistema", icon: Monitor },
                  { id: "light", label: "Claro", icon: Sun },
                  { id: "dark", label: "Escuro", icon: Moon },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={theme === t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setThemeState(t.id);
                  }}
                  className={cn("flex h-7 items-center gap-1.5 rounded-md px-3 text-sm", theme === t.id ? "bg-surface-1 text-fg shadow-sm" : "text-fg-muted hover:text-fg")}
                >
                  <t.icon className="size-3.5" strokeWidth={1.75} />
                  {t.label}
                </button>
              ))}
            </div>
            <label className="mt-4 flex w-fit flex-col gap-1">
              <span className="text-2xs text-fg-subtle">Idioma da interface</span>
              <select value="pt-BR" disabled className="h-8 rounded-md border border-border bg-surface-1 px-2 text-sm text-fg">
                <option value="pt-BR">Português (Brasil)</option>
              </select>
            </label>
          </Section>

          <Section title="Sessão">
            <Button variant="secondary" size="sm" onClick={logout}>
              <LogOut strokeWidth={1.75} /> Sair
            </Button>
          </Section>
        </div>
      </div>
    </div>
  );
}
