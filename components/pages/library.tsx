"use client";

import Link from "next/link";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Heart, Info, MessageSquare, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { MODELS, getModel } from "@/lib/catalog";
import { useUI } from "@/lib/client/ui-store";
import type { AssetDTO } from "@/lib/types";
import { MediaThumb } from "@/components/media/media-thumb";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./page-header";

type GenInfo = { id: string; prompt: string; modelId: string; conversationId: string; params: Record<string, unknown> };
type Page = { assets: AssetDTO[]; generations: Record<string, GenInfo>; nextCursor: string | null };

const KINDS = [
  { id: "", label: "Tudo" },
  { id: "image", label: "Imagens" },
  { id: "video", label: "Vídeos" },
  { id: "audio", label: "Áudios" },
];

/** Distribui itens em colunas (masonry) mantendo a ordem de leitura por linha. */
function useColumns() {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const calc = () => setCols(window.innerWidth < 640 ? 2 : window.innerWidth < 1024 ? 3 : window.innerWidth < 1536 ? 4 : 5);
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return cols;
}

export function Library() {
  const qc = useQueryClient();
  const [kind, setKind] = useState("");
  const [model, setModel] = useState("");
  const [favorites, setFavorites] = useState(false);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const openLightbox = useUI((s) => s.openLightbox);
  const cols = useColumns();
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const filters = { kind, model, favorites: favorites ? "1" : "", q: debounced };
  const query = useInfiniteQuery({
    queryKey: ["library", filters],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const sp = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]);
      if (pageParam) sp.set("cursor", pageParam);
      return api<Page>(`/api/assets?${sp}`);
    },
    getNextPageParam: (p) => p.nextCursor,
  });

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.assets) ?? [], [query.data]);
  const gens = useMemo(() => Object.assign({}, ...(query.data?.pages.map((p) => p.generations) ?? [])) as Record<string, GenInfo>, [query.data]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [query]);

  const columns = useMemo(() => {
    const out: { a: AssetDTO; i: number }[][] = Array.from({ length: cols }, () => []);
    items.forEach((a, i) => out[i % cols].push({ a, i }));
    return out;
  }, [items, cols]);

  const usedModels = useMemo(() => MODELS.filter((m, i, arr) => arr.findIndex((x) => x.name === m.name) === i), []);

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function bulk(action: "delete" | "favorite" | "unfavorite") {
    const ids = [...selected];
    try {
      await api("/api/assets/bulk", { method: "POST", json: { action, ids } });
      if (action === "delete") toast.success(`${ids.length} ${ids.length === 1 ? "item excluído" : "itens excluídos"}.`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({ queryKey: ["conversation"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function downloadSelected() {
    // Baixa um por vez (cada link é uma URL assinada com nome de arquivo).
    [...selected].forEach((id, i) =>
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = `/api/assets/${id}/download`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 400),
    );
  }

  async function toggleFav(a: AssetDTO) {
    await api(`/api/assets/${a.id}`, { method: "PATCH", json: { favorite: !a.favorite } });
    qc.invalidateQueries({ queryKey: ["library"] });
  }

  const selecting = selected.size > 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Biblioteca" description="Tudo o que você gerou, guardado no seu Storage.">
        <label className="flex h-8 w-full items-center gap-2 rounded-md border border-border bg-surface-1 px-2.5 text-sm focus-within:border-border-strong sm:w-64">
          <Search className="size-4 shrink-0 text-fg-subtle" strokeWidth={1.75} />
          <span className="sr-only">Buscar por prompt</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por prompt" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-subtle" />
        </label>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 pb-3 sm:px-6">
        <div role="radiogroup" aria-label="Tipo" className="flex gap-0.5 rounded-lg bg-surface-2 p-0.5">
          {KINDS.map((k) => (
            <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)} className={cn("h-7 rounded-md px-2.5 text-xs", kind === k.id ? "bg-surface-1 text-fg shadow-sm" : "text-fg-muted hover:text-fg")}>
              {k.label}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="lib-model">
          Modelo
        </label>
        <select id="lib-model" value={model} onChange={(e) => setModel(e.target.value)} className="h-8 max-w-48 rounded-md border border-border bg-surface-1 px-2 text-xs text-fg-muted outline-none">
          <option value="">Todos os modelos</option>
          {usedModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <button type="button" aria-pressed={favorites} onClick={() => setFavorites((f) => !f)} className={cn("flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs", favorites ? "border-accent/50 bg-accent-soft text-fg" : "border-border text-fg-muted hover:text-fg")}>
          <Heart className={cn("size-3.5", favorites && "fill-current text-accent")} strokeWidth={1.75} />
          Favoritos
        </button>
        <span className="ml-auto font-mono text-2xs text-fg-subtle">{items.length ? `${items.length}${query.hasNextPage ? "+" : ""} itens` : ""}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {query.isLoading && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="shimmer rounded-lg" style={{ aspectRatio: [1, 0.75, 1.33, 0.56][i % 4] }} />
            ))}
          </div>
        )}
        {query.isError && <p className="py-16 text-center text-sm text-fg-muted">{(query.error as Error).message}</p>}
        {!query.isLoading && !query.isError && items.length === 0 && (
          <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-24 text-center">
            <p className="text-sm text-fg">{debounced || kind || model || favorites ? "Nada com esses filtros." : "Nada gerado ainda."}</p>
            <p className="text-sm text-fg-muted">{debounced || kind || model || favorites ? "Tente limpar a busca ou trocar o tipo." : "O que você gerar no Studio aparece aqui automaticamente."}</p>
            {!(debounced || kind || model || favorites) && (
              <Button asChild variant="secondary" size="sm">
                <Link href="/">Ir para o Studio</Link>
              </Button>
            )}
          </div>
        )}
        <div className="flex gap-2">
          {columns.map((col, ci) => (
            <div key={ci} className="flex min-w-0 flex-1 flex-col gap-2">
              {col.map(({ a, i }) => {
                const g = a.generationId ? gens[a.generationId] : undefined;
                const isSel = selected.has(a.id);
                const ratio = a.width && a.height ? a.width / a.height : (() => {
                  const m = typeof g?.params.aspect_ratio === "string" ? /^(\d+):(\d+)$/.exec(g.params.aspect_ratio) : null;
                  return m ? Number(m[1]) / Number(m[2]) : a.kind === "video" ? 16 / 9 : 1;
                })();
                return (
                  <motion.div key={a.id} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group relative">
                    <button
                      type="button"
                      onClick={() =>
                        selecting
                          ? toggle(a.id)
                          : openLightbox(
                              items.map((asset) => ({ asset })),
                              i,
                            )
                      }
                      className={cn("block w-full rounded-lg transition-transform duration-150", isSel && "scale-[0.96]")}
                      aria-label={g?.prompt ? `Abrir: ${g.prompt.slice(0, 60)}` : "Abrir"}
                    >
                      <MediaThumb asset={a} className="w-full" style={{ aspectRatio: String(ratio) }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(a.id)}
                      aria-pressed={isSel}
                      aria-label={isSel ? "Desmarcar" : "Selecionar"}
                      className={cn(
                        "absolute left-1.5 top-1.5 grid size-5 place-items-center rounded-full border transition-opacity duration-150",
                        isSel ? "border-accent bg-accent text-accent-fg opacity-100" : "border-white/70 bg-black/30 text-transparent opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
                      )}
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </button>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 rounded-b-lg bg-gradient-to-t from-black/60 to-transparent p-2 pt-8 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      <span className="line-clamp-2 text-2xs text-white/90">{getModel(g?.modelId)?.name}</span>
                      <span className="pointer-events-auto flex gap-1">
                        <button type="button" onClick={() => toggleFav(a)} aria-label={a.favorite ? "Remover dos favoritos" : "Favoritar"} className="grid size-6 place-items-center rounded-md bg-black/50 text-white hover:bg-black/70">
                          <Heart className={cn("size-3.5", a.favorite && "fill-current text-accent")} strokeWidth={1.75} />
                        </button>
                        {g && (
                          <Link href={`/c/${g.conversationId}`} aria-label="Abrir conversa de origem" className="grid size-6 place-items-center rounded-md bg-black/50 text-white hover:bg-black/70">
                            <MessageSquare className="size-3.5" strokeWidth={1.75} />
                          </Link>
                        )}
                        {g && (
                          <Link href={`/g/${a.generationId}`} aria-label="Detalhe" className="grid size-6 place-items-center rounded-md bg-black/50 text-white hover:bg-black/70">
                            <Info className="size-3.5" strokeWidth={1.75} />
                          </Link>
                        )}
                      </span>
                    </div>
                    {a.favorite && <Heart className="pointer-events-none absolute right-2 top-2 size-3.5 fill-current text-accent drop-shadow group-hover:opacity-0" strokeWidth={1.75} />}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
        <div ref={sentinel} className="h-8" />
        {query.isFetchingNextPage && <p className="pb-6 text-center text-xs text-fg-subtle">Carregando...</p>}
      </div>

      <AnimatePresence>
        {selecting && (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-border-strong bg-surface-1 p-1 pl-3 shadow-[var(--shadow-pop)]"
            role="toolbar"
            aria-label="Ações da seleção"
          >
            <span className="pr-2 text-sm text-fg">
              {selected.size} {selected.size === 1 ? "selecionado" : "selecionados"}
            </span>
            <Button size="sm" variant="ghost" onClick={downloadSelected}>
              <Download strokeWidth={1.75} /> Baixar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => bulk("favorite")}>
              <Heart strokeWidth={1.75} /> Favoritar
            </Button>
            <Button size="sm" variant="danger" onClick={() => bulk("delete")}>
              <Trash2 strokeWidth={1.75} /> Excluir
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Limpar seleção" onClick={() => setSelected(new Set())}>
              <X strokeWidth={1.75} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
