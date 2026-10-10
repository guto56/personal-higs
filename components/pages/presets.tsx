"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Clapperboard, Megaphone, Search, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { getModel, MODES, modelsFor, type Mode } from "@/lib/catalog";
import { useComposer } from "@/lib/client/composer-store";
import { PageHeader } from "./page-header";

type Item = { id: string; name: string; preview: string | null; group?: string | null; aspectRatio?: string | null; width?: number; height?: number; description?: string };

type Tab = {
  id: string;
  label: string;
  source: string;
  mode: Mode;
  subtype: string;
  model: string;
  field: string;
  extra?: Record<string, unknown>;
};

const TABS: Tab[] = (
  [
    { id: "restyle", label: "Restyle de vídeo", source: "/api/catalog/presets?source=genjutsu-restyle", mode: "edit", subtype: "restyle", model: "higgsfield/genjutsu/restyle/v1.0", field: "preset_id" },
    { id: "marketing", label: "Marketing", source: "/api/catalog/presets?source=marketing-studio", mode: "apps", subtype: "marketing", model: "marketing-studio/image", field: "preset_id", extra: { enhance_prompt: true, quality: "high" } },
    { id: "soul2", label: "Estilos Soul V2", source: "/api/catalog/styles?version=v2", mode: "image", subtype: "text", model: "higgsfield-ai/soul/v2/standard", field: "style_id" },
    { id: "soul1", label: "Estilos Soul", source: "/api/catalog/styles?version=v1", mode: "image", subtype: "text", model: "higgsfield-ai/soul/standard", field: "style_id" },
  ] satisfies Tab[]
).filter((t) => getModel(t.model) && modelsFor(t.mode, t.subtype).some((m) => m.id === t.model));

const APPS: { mode: Mode; subtype: string; icon: typeof Megaphone; title: string; text: string }[] = (
  [
    { mode: "apps", subtype: "ads", icon: Megaphone, title: "Ads Studio", text: "Briefing vira até 8 conceitos de anúncio prontos." },
    { mode: "apps", subtype: "marketing", icon: ShoppingBag, title: "Marketing Studio", text: "Fotos de produto e campanha com presets de direção." },
    { mode: "apps", subtype: "cinema", icon: Clapperboard, title: "Cinema Studio", text: "Vídeo com câmera, lente, luz e paleta de cinema." },
  ] as const
).filter((a) => MODES.some((m) => m.id === a.mode && m.subtypes.some((s) => s.id === a.subtype)));

export function Presets() {
  const router = useRouter();
  const load = useComposer((s) => s.load);
  const [tab, setTab] = useState(TABS[0]?.id ?? "");
  const [q, setQ] = useState("");
  const current = TABS.find((t) => t.id === tab);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["presets", current?.source],
    enabled: !!current,
    staleTime: 30 * 60_000,
    queryFn: () => api<{ items: Item[] }>(current!.source).then((r) => r.items),
  });
  const items = useMemo(() => (data ?? []).filter((i) => !q || `${i.name} ${i.group ?? ""}`.toLowerCase().includes(q.toLowerCase())), [data, q]);

  function open(t: Tab, item: Item) {
    const st = useComposer.getState();
    const params: Record<string, unknown> = { ...(st.paramsByModel[t.model] ?? {}), [t.field]: item.id, ...(t.extra ?? {}) };
    if (item.aspectRatio) params.aspect_ratio = item.aspectRatio;
    load({ mode: t.mode, subtype: t.subtype, modelId: t.model, params });
    router.push("/");
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PageHeader title="Presets e apps" description="Pontos de partida prontos da Higgsfield. Clique para abrir no Studio já configurado." />

      {APPS.length > 0 && (
        <section className="px-4 pb-6 sm:px-6">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {APPS.map((a) => (
              <button
                key={a.subtype}
                type="button"
                onClick={() => (load({ mode: a.mode, subtype: a.subtype }), router.push("/"))}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface-1 p-4 text-left transition-colors hover:border-border-strong"
              >
                <a.icon className="mt-0.5 size-5 shrink-0 text-fg-muted" strokeWidth={1.5} />
                <span>
                  <span className="block text-sm font-medium text-fg">{a.title}</span>
                  <span className="mt-0.5 block text-xs text-fg-muted">{a.text}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-bg/95 px-4 py-2 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div role="tablist" aria-label="Coleções" className="-mx-1 flex gap-0.5 overflow-x-auto px-1 [scrollbar-width:none]">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cn("h-8 shrink-0 rounded-md px-3 text-sm", tab === t.id ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg")}>
              {t.label}
            </button>
          ))}
        </div>
        <label className="flex h-8 items-center gap-2 rounded-md border border-border bg-surface-1 px-2.5 text-sm sm:w-56">
          <Search className="size-4 text-fg-subtle" strokeWidth={1.75} />
          <span className="sr-only">Buscar</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-subtle" />
        </label>
      </div>

      <div className="px-4 py-4 sm:px-6">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="shimmer aspect-[4/5] rounded-lg" />
            ))}
          </div>
        )}
        {isError && <p className="py-12 text-sm text-fg-muted">{(error as Error).message}</p>}
        {!isLoading && items.length === 0 && !isError && <p className="py-12 text-sm text-fg-muted">Nada encontrado.</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
          {current &&
            items.map((item) => (
              <button key={item.id} type="button" onClick={() => open(current, item)} className="group flex flex-col gap-1.5 text-left">
                <div className="aspect-[4/5] w-full overflow-hidden rounded-lg bg-surface-2">
                  {item.preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.preview} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-[1.03]" />
                  )}
                </div>
                <span className="truncate text-xs text-fg-muted group-hover:text-fg">{item.name}</span>
                {item.group && <span className="-mt-1 truncate text-2xs text-fg-subtle">{item.group}</span>}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
