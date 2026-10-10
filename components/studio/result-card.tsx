"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Ban,
  Check,
  Copy,
  Download,
  ExternalLink,
  Heart,
  Maximize2,
  MoreHorizontal,
  RefreshCw,
  Repeat2,
  RotateCcw,
  Shuffle,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { cn, aspectToNumber, formatCredits, formatElapsed } from "@/lib/utils";
import { CHAIN_ACTIONS, getMode, getModel, modelsFor, slotForChain, type Mode } from "@/lib/catalog";
import { api } from "@/lib/client/api";
import { useComposer, type Attachment } from "@/lib/client/composer-store";
import { useActive, useCreateGeneration, qk, type ConversationData } from "@/lib/client/queries";
import { useUI } from "@/lib/client/ui-store";
import type { AssetDTO, GenerationDTO } from "@/lib/types";
import { IconButton } from "@/components/ui/icon-button";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { MediaThumb } from "@/components/media/media-thumb";

export function assetToAttachment(a: AssetDTO, field: string): Attachment {
  return { localId: crypto.randomUUID(), field, kind: a.kind, status: "ready", progress: 1, assetId: a.id, previewUrl: a.url, fileName: a.fileName ?? "arquivo", width: a.width, height: a.height, duration: a.duration };
}

/** Carrega a configuração de uma geração no composer (reutilizar). */
export function reuseGeneration(g: GenerationDTO) {
  const attachments = Object.entries(g.inputs).flatMap(([field, list]) => list.map((a) => assetToAttachment(a, field)));
  useComposer.getState().load({ mode: g.mode as Mode, subtype: g.subtype, modelId: g.modelId, params: g.params, prompt: g.prompt, negativePrompt: g.negativePrompt, attachments });
}

/** Envia uma saída para outro modo já com o arquivo anexado. */
export function chainFrom(g: GenerationDTO, a: AssetDTO, actionId: string) {
  const action = CHAIN_ACTIONS.find((x) => x.id === actionId);
  if (!action) return;
  const sub = getMode(action.mode)?.subtypes.find((s) => s.id === action.subtype);
  if (!sub) return;
  const st = useComposer.getState();
  const chosen = st.modelBySub[`${action.mode}/${action.subtype}`];
  const model = getModel(modelsFor(action.mode, action.subtype).some((m) => m.id === chosen) ? chosen : sub.defaultModel);
  if (!model) return;
  const slot = slotForChain(model, action.slotKind);
  st.load({
    mode: action.mode,
    subtype: action.subtype,
    modelId: model.id,
    prompt: "",
    attachments: slot ? [assetToAttachment(a, slot.field)] : [],
    chain: { parentGenerationId: g.id, parentAssetId: a.id, action: action.id },
  });
}

export function downloadAsset(id: string) {
  const a = document.createElement("a");
  a.href = `/api/assets/${id}/download`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const STATUS_LABEL: Record<string, string> = { queued: "Na fila", processing: "Gerando", completed: "Pronto", failed: "Falhou", canceled: "Cancelada", nsfw: "Bloqueada" };

function useElapsed(from: string, until: string | null, running: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  return (until ? Date.parse(until) : now) - Date.parse(from);
}

function expectedCount(g: GenerationDTO) {
  const model = getModel(g.modelId);
  if (model?.output !== "image") return 1;
  const b = g.params.batch_size;
  return typeof b === "number" && b > 0 ? Math.min(b, 8) : 1;
}

function ratioOf(g: GenerationDTO) {
  const r = aspectToNumber(g.params.aspect_ratio);
  if (r) return r;
  return getModel(g.modelId)?.output === "video" ? 16 / 9 : 1;
}

export function ResultCard({ g }: { g: GenerationDTO }) {
  const qc = useQueryClient();
  const router = useRouter();
  const model = getModel(g.modelId);
  const openLightbox = useUI((s) => s.openLightbox);
  const create = useCreateGeneration();
  const running = g.status === "queued" || g.status === "processing";
  const elapsed = useElapsed(g.createdAt, g.completedAt, running);
  const count = g.outputs.length || expectedCount(g);
  const ratio = ratioOf(g);
  const [favs, setFavs] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const firstInput = Object.values(g.inputs).flat().find((a) => a.kind === "image") ?? null;
  const chainOptions = (kind: AssetDTO["kind"]) => CHAIN_ACTIONS.filter((a) => a.slotKind === kind);

  const lightboxItems = g.outputs.map((asset) => ({ asset, generation: g, before: g.mode === "edit" ? firstInput : null }));

  async function toggleFav(a: AssetDTO) {
    const next = !(favs[a.id] ?? a.favorite);
    setFavs((f) => ({ ...f, [a.id]: next }));
    await api(`/api/assets/${a.id}`, { method: "PATCH", json: { favorite: next } }).catch(() => setFavs((f) => ({ ...f, [a.id]: !next })));
    qc.invalidateQueries({ queryKey: ["library"] });
  }

  async function remove() {
    await api(`/api/generations/${g.id}`, { method: "DELETE" });
    qc.setQueryData<ConversationData>(qk.conversation(g.conversationId), (old) => (old ? { ...old, generations: old.generations.filter((x) => x.id !== g.id) } : old));
    useActive.getState().untrack(g.id);
    qc.invalidateQueries({ queryKey: ["library"] });
  }

  async function cancel() {
    try {
      await api(`/api/generations/${g.id}/cancel`, { method: "POST" });
      qc.invalidateQueries({ queryKey: qk.conversation(g.conversationId) });
      useActive.getState().untrack(g.id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function rerun(randomSeed: boolean) {
    const seedParam = model?.params.find((p) => p.kind === "seed");
    const params = { ...g.params };
    if (randomSeed && seedParam && seedParam.kind === "seed") params.seed = Math.floor(seedParam.min + Math.random() * Math.min(seedParam.max - seedParam.min, 999_999));
    else if (randomSeed) delete params.seed;
    create.mutate(
      {
        conversationId: g.conversationId,
        modelId: g.modelId,
        mode: g.mode,
        subtype: g.subtype,
        prompt: g.prompt,
        negativePrompt: g.negativePrompt,
        params,
        inputs: Object.fromEntries(Object.entries(g.inputs).map(([k, v]) => [k, v.map((a) => a.id)])),
        parentGenerationId: g.id,
        chainAction: randomSeed ? "variation" : "retry",
      },
      { onError: (e) => toast.error((e as Error).message) },
    );
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(g.prompt).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const cols = count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 2 : 4;
  const maxW = count === 1 ? (ratio >= 1 ? "max-w-[560px]" : "max-w-[360px]") : "max-w-[620px]";

  return (
    <motion.article initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="group/card flex flex-col gap-2" aria-busy={running} aria-label={`Resultado: ${STATUS_LABEL[g.status]}`}>
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-fg">{model?.name ?? g.modelId}</span>
        <span className={cn("flex items-center gap-1", g.status === "completed" ? "text-fg-subtle" : g.status === "failed" || g.status === "nsfw" ? "text-danger" : "text-fg-muted")}>
          {running && <span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden />}
          {g.status === "processing" && g.outputs.length === 0 && elapsed > 0 ? STATUS_LABEL.processing : STATUS_LABEL[g.status]}
        </span>
        <span className="font-mono tabular text-fg-subtle">{formatElapsed(elapsed)}</span>
      </div>

      {(running || g.status === "completed") && (
        <div className={cn("grid gap-1.5", maxW)} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: count }).map((_, i) => {
            const a = g.outputs[i];
            if (!a) {
              return (
                <div key={i} className="relative overflow-hidden rounded-lg" style={{ aspectRatio: String(ratio) }}>
                  <div className="shimmer absolute inset-0" />
                  {i === 0 && (
                    <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-surface-3">
                      <motion.div className="h-full w-1/3 bg-accent" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
                    </div>
                  )}
                </div>
              );
            }
            const fav = favs[a.id] ?? a.favorite;
            return (
              <div key={a.id} className="group/tile relative">
                <button type="button" onClick={() => openLightbox(lightboxItems, i)} className="block w-full rounded-lg" aria-label="Abrir em tela cheia">
                  <MediaThumb asset={a} reveal className="w-full" fit="cover" style={{ aspectRatio: String(a.width && a.height ? a.width / a.height : ratio) }} />
                </button>
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover/tile:opacity-100 [@media(hover:none)]:opacity-100">
                  <button type="button" onClick={() => toggleFav(a)} aria-pressed={fav} aria-label={fav ? "Remover dos favoritos" : "Favoritar"} className="grid size-7 place-items-center rounded-md bg-black/55 text-white backdrop-blur-sm hover:bg-black/70">
                    <Heart className={cn("size-3.5", fav && "fill-current text-accent")} strokeWidth={1.75} />
                  </button>
                  <a href={`/api/assets/${a.id}/download`} aria-label="Baixar" className="grid size-7 place-items-center rounded-md bg-black/55 text-white backdrop-blur-sm hover:bg-black/70">
                    <Download className="size-3.5" strokeWidth={1.75} />
                  </a>
                  {chainOptions(a.kind).length > 0 && (
                    <Menu>
                      <MenuTrigger aria-label="Continuar com" className="grid size-7 place-items-center rounded-md bg-black/55 text-white backdrop-blur-sm hover:bg-black/70 data-[state=open]:bg-black/70">
                        <ArrowRight className="size-3.5" strokeWidth={1.75} />
                      </MenuTrigger>
                      <MenuContent>
                        <MenuLabel>Continuar com</MenuLabel>
                        {chainOptions(a.kind).map((c) => (
                          <MenuItem key={c.id} onSelect={() => chainFrom(g, a, c.id)}>
                            {c.label}
                          </MenuItem>
                        ))}
                      </MenuContent>
                    </Menu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(g.status === "failed" || g.status === "nsfw" || g.status === "canceled") && (
        <div className={cn("flex max-w-[560px] items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm", g.status === "canceled" ? "border-border text-fg-muted" : "border-danger/30 bg-danger-soft text-fg")} role="alert">
          {g.status === "canceled" ? <Ban className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} /> : <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.75} />}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p>{g.error ?? "A geração não foi concluída."}</p>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => rerun(false)} className="flex h-7 items-center gap-1.5 rounded-md border border-border-strong bg-surface-1 px-2.5 text-xs hover:bg-surface-2">
                <RotateCcw className="size-3.5" strokeWidth={1.75} />
                Tentar de novo
              </button>
              <button type="button" onClick={() => reuseGeneration(g)} className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs text-fg-muted hover:bg-surface-2 hover:text-fg">
                Editar e reenviar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-fg-subtle">
        {g.seed != null && <span className="font-mono">seed {g.seed}</span>}
        {g.estimate?.credits != null && <span className="font-mono">{formatCredits(g.estimate.credits)} cr</span>}
        {g.outputs[0]?.duration ? <span className="font-mono">{Math.round(g.outputs[0].duration)}s</span> : null}
        <span className="flex-1" />
        <div className={cn("flex items-center gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover/card:opacity-100 [@media(hover:none)]:opacity-100", running && "opacity-100")}>
          {g.status === "queued" && <IconButton label="Cancelar" size="icon-sm" icon={<Ban strokeWidth={1.75} />} onClick={cancel} />}
          {g.outputs.length > 0 && <IconButton label="Tela cheia" size="icon-sm" icon={<Maximize2 strokeWidth={1.75} />} onClick={() => openLightbox(lightboxItems, 0)} />}
          {g.outputs.length === 1 && (
            <IconButton label="Baixar" size="icon-sm" icon={<Download strokeWidth={1.75} />} onClick={() => downloadAsset(g.outputs[0].id)} />
          )}
          {g.prompt && <IconButton label={copied ? "Copiado" : "Copiar prompt"} size="icon-sm" icon={copied ? <Check strokeWidth={1.75} /> : <Copy strokeWidth={1.75} />} onClick={copyPrompt} />}
          <IconButton label="Reutilizar configurações" size="icon-sm" icon={<Repeat2 strokeWidth={1.75} />} onClick={() => reuseGeneration(g)} />
          {g.status === "completed" && <IconButton label="Gerar variação" size="icon-sm" icon={<Shuffle strokeWidth={1.75} />} onClick={() => rerun(true)} disabled={create.isPending} />}
          <Menu>
            <MenuTrigger aria-label="Mais ações" className="grid size-7 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg data-[state=open]:bg-surface-2">
              <MoreHorizontal className="size-3.5" strokeWidth={1.75} />
            </MenuTrigger>
            <MenuContent>
              {g.outputs[0] && chainOptions(g.outputs[0].kind).length > 0 && (
                <>
                  <MenuLabel>Continuar com</MenuLabel>
                  {chainOptions(g.outputs[0].kind).map((c) => (
                    <MenuItem key={c.id} icon={<ArrowRight strokeWidth={1.75} />} onSelect={() => chainFrom(g, g.outputs[0], c.id)}>
                      {c.label}
                    </MenuItem>
                  ))}
                  <MenuSeparator />
                </>
              )}
              <MenuItem icon={<RefreshCw strokeWidth={1.75} />} onSelect={() => rerun(false)}>
                Gerar de novo
              </MenuItem>
              <MenuItem icon={<ExternalLink strokeWidth={1.75} />} onSelect={() => router.push(`/g/${g.id}`)}>
                Abrir detalhe
              </MenuItem>
              <MenuSeparator />
              <MenuItem icon={<Trash2 strokeWidth={1.75} />} danger onSelect={remove}>
                Excluir
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </div>
      {g.parentGenerationId && g.chainAction && !["variation", "retry"].includes(g.chainAction) && (
        <Link href={`/g/${g.parentGenerationId}`} className="w-fit text-2xs text-fg-subtle hover:text-fg">
          Derivado de outra geração
        </Link>
      )}
    </motion.article>
  );
}
