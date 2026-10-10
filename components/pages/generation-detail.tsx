"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Download, MessageSquare, Repeat2 } from "lucide-react";
import { cn, formatCredits, formatElapsed } from "@/lib/utils";
import { CHAIN_ACTIONS, getModel, valueLabel } from "@/lib/catalog";
import { api } from "@/lib/client/api";
import { useUI } from "@/lib/client/ui-store";
import { TERMINAL, type GenerationDTO } from "@/lib/types";
import { MediaThumb } from "@/components/media/media-thumb";
import { VideoPlayer } from "@/components/media/video-player";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "@/components/ui/menu";
import { chainFrom, reuseGeneration } from "@/components/studio/result-card";

type Data = { generation: GenerationDTO; chain: GenerationDTO[]; children: GenerationDTO[] };

function Row({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <dt className="shrink-0 text-fg-muted">{label}</dt>
      <dd className={cn("min-w-0 truncate text-right text-fg", mono && "font-mono text-xs")}>{children}</dd>
    </div>
  );
}

function MiniGen({ g, label }: { g: GenerationDTO; label: string }) {
  const out = g.outputs[0];
  return (
    <Link href={`/g/${g.id}`} className="flex items-center gap-2.5 rounded-lg border border-border p-1.5 pr-3 hover:border-border-strong hover:bg-surface-1">
      {out ? <MediaThumb asset={out} className="size-10 shrink-0" rounded /> : <div className="size-10 shrink-0 rounded-md bg-surface-2" />}
      <span className="min-w-0">
        <span className="block text-2xs text-fg-subtle">{label}</span>
        <span className="block truncate text-sm text-fg">{getModel(g.modelId)?.name ?? g.modelId}</span>
      </span>
    </Link>
  );
}

export function GenerationDetail({ id }: { id: string }) {
  const router = useRouter();
  const openLightbox = useUI((s) => s.openLightbox);
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState(0);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["generation", id],
    queryFn: () => api<Data>(`/api/generations/${id}`),
    refetchInterval: (q) => (q.state.data && !TERMINAL.includes(q.state.data.generation.status) ? 3000 : false),
  });

  if (isLoading)
    return (
      <div className="grid h-full gap-6 p-6 lg:grid-cols-[1fr_340px]" aria-hidden>
        <div className="shimmer h-full min-h-80 rounded-xl" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shimmer h-5 rounded" />
          ))}
        </div>
      </div>
    );
  if (isError || !data)
    return (
      <div className="flex flex-col items-start gap-2 p-8">
        <p className="text-sm text-fg">{(error as Error)?.message ?? "Não encontrado."}</p>
        <Link href="/biblioteca" className="text-sm text-fg-muted hover:text-fg">
          Voltar para a Biblioteca
        </Link>
      </div>
    );

  const g = data.generation;
  const model = getModel(g.modelId);
  const out = g.outputs[active] ?? g.outputs[0];
  const inputs = Object.entries(g.inputs).flatMap(([field, list]) => list.map((a) => ({ a, label: model?.slots.find((s) => s.field === field)?.label ?? field })));
  const paramRows = (model?.params ?? [])
    .map((p) => {
      const v = g.params[p.field];
      if (v === undefined || v === null || v === "") return null;
      const shown = p.kind === "enum" ? (p.options.find((o) => o.value === v)?.label ?? String(v)) : p.kind === "boolean" ? (v ? "Sim" : "Não") : typeof v === "number" || typeof v === "string" ? (p.kind === "style" || p.kind === "preset" || p.kind === "character" ? String(v).slice(0, 8) : valueLabel(p.field, v)) : "";
      return { label: p.label, value: shown, mono: p.kind === "seed" || p.kind === "range" || p.kind === "style" || p.kind === "preset" || p.kind === "character" };
    })
    .filter((x): x is { label: string; value: string; mono: boolean } => !!x);

  const elapsed = g.completedAt ? Date.parse(g.completedAt) - Date.parse(g.createdAt) : null;

  return (
    <div className="flex h-full flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <div className="flex min-h-[50vh] flex-1 flex-col gap-3 p-4 sm:p-6 lg:min-h-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft strokeWidth={1.75} /> Voltar
          </Button>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center rounded-xl bg-surface-1">
          {!out && <div className="shimmer absolute inset-0 rounded-xl" />}
          {out?.kind === "image" && (
            <button type="button" onClick={() => openLightbox(g.outputs.map((asset) => ({ asset, generation: g, before: g.mode === "edit" ? inputs[0]?.a : null })), active)} className="flex size-full items-center justify-center p-3" aria-label="Tela cheia">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={out.url} alt={g.prompt} className="max-h-full max-w-full rounded-lg object-contain" />
            </button>
          )}
          {out?.kind === "video" && <VideoPlayer src={out.url} autoPlay className="max-h-full w-full rounded-lg" />}
          {out?.kind === "audio" && <audio src={out.url} controls className="w-[min(100%,480px)]" />}
        </div>
        {g.outputs.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto">
            {g.outputs.map((a, i) => (
              <button key={a.id} type="button" onClick={() => setActive(i)} aria-label={`Saída ${i + 1}`} className={cn("rounded-md border-2", i === active ? "border-accent" : "border-transparent")}>
                <MediaThumb asset={a} className="size-14" />
              </button>
            ))}
          </div>
        )}
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-5 border-t border-border p-4 sm:p-6 lg:w-[360px] lg:overflow-y-auto lg:border-l lg:border-t-0">
        <div>
          <p className="text-2xs text-fg-subtle">{new Date(g.createdAt).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" })}</p>
          <h1 className="mt-0.5 text-lg font-medium">{model?.name ?? g.modelId}</h1>
          <p className="font-mono text-2xs text-fg-subtle">{g.modelId}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              reuseGeneration(g);
              router.push(`/c/${g.conversationId}`);
            }}
          >
            <Repeat2 strokeWidth={1.75} /> Reutilizar
          </Button>
          {out && CHAIN_ACTIONS.some((c) => c.slotKind === out.kind) && (
            <Menu>
              <MenuTrigger asChild>
                <Button size="sm" variant="secondary">
                  <ArrowRight strokeWidth={1.75} /> Continuar com
                </Button>
              </MenuTrigger>
              <MenuContent align="start">
                <MenuLabel>Continuar com</MenuLabel>
                {CHAIN_ACTIONS.filter((c) => c.slotKind === out.kind).map((c) => (
                  <MenuItem
                    key={c.id}
                    onSelect={() => {
                      chainFrom(g, out, c.id);
                      router.push(`/c/${g.conversationId}`);
                    }}
                  >
                    {c.label}
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
          )}
          {out && (
            <Button size="sm" variant="secondary" asChild>
              <a href={`/api/assets/${out.id}/download`}>
                <Download strokeWidth={1.75} /> Baixar
              </a>
            </Button>
          )}
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/c/${g.conversationId}`}>
              <MessageSquare strokeWidth={1.75} /> Conversa
            </Link>
          </Button>
        </div>

        {g.prompt && (
          <section>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-2xs text-fg-subtle">Prompt</h2>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(g.prompt).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
                className="flex items-center gap-1 text-2xs text-fg-subtle hover:text-fg"
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />} {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-fg">{g.prompt}</p>
            {g.negativePrompt && <p className="mt-2 text-sm text-fg-muted">Evitar: {g.negativePrompt}</p>}
          </section>
        )}

        <section>
          <h2 className="mb-1 text-2xs text-fg-subtle">Parâmetros</h2>
          <dl className="divide-y divide-border">
            <Row label="Status">{{ queued: "Na fila", processing: "Gerando", completed: "Concluída", failed: "Falhou", canceled: "Cancelada", nsfw: "Bloqueada" }[g.status]}</Row>
            {paramRows.map((r) => (
              <Row key={r.label} label={r.label} mono={r.mono}>
                {r.value}
              </Row>
            ))}
            {g.estimate?.credits != null && (
              <Row label="Custo" mono>
                {formatCredits(g.estimate.credits)} cr
              </Row>
            )}
            {elapsed != null && (
              <Row label="Tempo" mono>
                {formatElapsed(elapsed)}
              </Row>
            )}
          </dl>
          {g.error && <p className="mt-2 text-sm text-danger">{g.error}</p>}
        </section>

        {inputs.length > 0 && (
          <section>
            <h2 className="mb-1.5 text-2xs text-fg-subtle">Entradas</h2>
            <div className="flex flex-wrap gap-2">
              {inputs.map(({ a, label }, i) => (
                <button key={`${a.id}-${i}`} type="button" onClick={() => openLightbox(inputs.map((x) => ({ asset: x.a })), i)} className="flex flex-col gap-1 text-left">
                  <MediaThumb asset={a} className="size-16" />
                  <span className="max-w-16 truncate text-2xs text-fg-subtle">{label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {(data.chain.length > 0 || data.children.length > 0) && (
          <section className="flex flex-col gap-1.5">
            <h2 className="text-2xs text-fg-subtle">Cadeia de origem</h2>
            {[...data.chain].reverse().map((c) => (
              <MiniGen key={c.id} g={c} label="Veio de" />
            ))}
            {data.children.map((c) => (
              <MiniGen key={c.id} g={c} label={c.chainAction === "variation" ? "Variação" : "Derivada"} />
            ))}
          </section>
        )}
      </aside>
    </div>
  );
}
