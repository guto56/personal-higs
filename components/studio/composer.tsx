"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Loader2, Minus, SlidersHorizontal, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { cn, formatCredits } from "@/lib/utils";
import { MODES, type Mode, type ParamDef } from "@/lib/catalog";
import { currentModel, currentParams, currentSubtype, useComposer } from "@/lib/client/composer-store";
import { useCreateGeneration } from "@/lib/client/queries";
import { api, ClientApiError } from "@/lib/client/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { ModeSwitcher } from "./mode-switcher";
import { ModelPicker } from "./model-picker";
import { ParamChip, ParamEditor, chipClass } from "./param-chip";
import { routeFiles, SlotBar } from "./slot-bar";

/** Comandos com barra: trocam o modo rapidamente. */
type Slash = { cmd: string; label: string; mode: Mode; subtype: string };
const SLASH_ALL: Slash[] = [
  { cmd: "imagem", label: "Imagem a partir de texto", mode: "image", subtype: "text" },
  { cmd: "personagem", label: "Imagem com personagem", mode: "image", subtype: "character" },
  { cmd: "video", label: "Vídeo a partir de texto", mode: "video", subtype: "text" },
  { cmd: "animar", label: "Vídeo a partir de imagem", mode: "video", subtype: "image" },
  { cmd: "frames", label: "Primeiro + último frame", mode: "video", subtype: "frames" },
  { cmd: "referencia", label: "Vídeo com referências", mode: "video", subtype: "reference" },
  { cmd: "motion", label: "Motion control", mode: "video", subtype: "motion" },
  { cmd: "editar", label: "Editar imagem", mode: "edit", subtype: "image" },
  { cmd: "editarvideo", label: "Editar vídeo", mode: "edit", subtype: "video" },
  { cmd: "restyle", label: "Restyle de vídeo", mode: "edit", subtype: "restyle" },
  { cmd: "estender", label: "Estender vídeo", mode: "edit", subtype: "extend" },
  { cmd: "anuncio", label: "Ads Studio", mode: "apps", subtype: "ads" },
  { cmd: "marketing", label: "Marketing Studio", mode: "apps", subtype: "marketing" },
  { cmd: "cinema", label: "Cinema Studio", mode: "apps", subtype: "cinema" },
];
const SLASH = SLASH_ALL.filter((c) => MODES.some((m) => m.id === c.mode && m.subtypes.some((s) => s.id === c.subtype)));

function useEstimate(modelId: string, params: Record<string, unknown>, inputs: Record<string, string[]>) {
  const [debounced, setDebounced] = useState({ modelId, params, inputs });
  const key = JSON.stringify({ modelId, params, inputs });
  useEffect(() => {
    const t = setTimeout(() => setDebounced({ modelId, params, inputs }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return useQuery({
    queryKey: ["estimate", JSON.stringify(debounced)],
    queryFn: () => api<{ estimate: { type: "credits"; credits: number; usd: number } | { type: "description"; text: string } | null }>("/api/estimate", { method: "POST", json: { ...debounced, prompt: "x" } }),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function Composer({ conversationId, compact }: { conversationId: string | null; compact?: boolean }) {
  const router = useRouter();
  const s = useComposer();
  const sub = currentSubtype(s);
  const model = currentModel(s);
  const params = currentParams(s);
  const create = useCreateGeneration();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [advOpen, setAdvOpen] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const attachments = s.attachments;
  const inputs = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const a of attachments) if (a.status === "ready" && a.assetId) (out[a.field] ??= []).push(a.assetId);
    return out;
  }, [attachments]);
  const estimate = useEstimate(model.id, params, inputs);

  const mainParams = model.params.filter((p) => p.group === "main");
  const advParams = model.params.filter((p) => p.group === "advanced");
  if (sub.id === "character") {
    const c = mainParams.find((p) => p.kind === "character");
    if (c) {
      mainParams.splice(mainParams.indexOf(c), 1);
      mainParams.unshift({ ...c, required: true } as ParamDef);
    }
  }

  // Foco ao trocar de config (reutilizar, encadear, Nova).
  useEffect(() => {
    textarea.current?.focus();
  }, [s.focusToken]);
  useEffect(() => {
    const onNew = () => {
      useComposer.getState().clearAfterSubmit();
      setTimeout(() => textarea.current?.focus(), 50);
    };
    window.addEventListener("studio:new", onNew);
    return () => window.removeEventListener("studio:new", onNew);
  }, []);

  // Auto-resize do prompt.
  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, compact ? 160 : 240)}px`;
  }, [s.prompt, compact]);

  const slashQuery = /^\/(\w*)$/.exec(s.prompt)?.[1];
  const slashMatches = slashQuery !== undefined ? SLASH.filter((c) => c.cmd.startsWith(slashQuery.toLowerCase())) : [];
  const applySlash = (c: (typeof SLASH)[number]) => {
    s.load({ mode: c.mode, subtype: c.subtype, prompt: "" });
    setSlashIndex(0);
  };

  const uploading = attachments.some((a) => a.status === "uploading");
  const hasErrorAttachment = attachments.some((a) => a.status === "error");
  const missingSlots = model.slots.filter((sl) => sl.required && !attachments.some((a) => a.field === sl.field && a.status === "ready"));
  const needsPrompt = !!model.prompt?.required && !s.prompt.trim();
  const needsCharacter = sub.id === "character" && !params.custom_reference_id;
  const canSubmit = !create.isPending && !uploading && missingSlots.length === 0 && !needsPrompt && !needsCharacter;

  async function submit() {
    if (!canSubmit) {
      const why = uploading
        ? "Aguarde o envio dos anexos."
        : missingSlots.length
          ? `Anexe: ${missingSlots.map((m) => m.label).join(", ")}.`
          : needsCharacter
            ? "Escolha um personagem."
            : needsPrompt
              ? "Escreva um prompt."
              : null;
      if (why) setErrors([why]);
      return;
    }
    setErrors([]);
    try {
      const g = await create.mutateAsync({
        conversationId,
        modelId: model.id,
        mode: s.mode,
        subtype: sub.id,
        prompt: s.prompt,
        negativePrompt: s.showNegative ? s.negativePrompt : null,
        params,
        inputs,
        parentGenerationId: s.chain?.parentGenerationId ?? null,
        parentAssetId: s.chain?.parentAssetId ?? null,
        chainAction: s.chain?.action ?? null,
      });
      s.clearAfterSubmit();
      if (!conversationId) router.replace(`/c/${g.conversationId}`, { scroll: false });
    } catch (e) {
      const err = e as ClientApiError;
      const details = (err.details as { generationId?: string; conversationId?: string } | undefined) ?? undefined;
      if (details?.conversationId) {
        // A falha ficou registrada na conversa; mostra o card de erro lá.
        if (!conversationId) router.replace(`/c/${details.conversationId}`, { scroll: false });
        else create.reset();
      }
      if (err.code === "invalid_params" && Array.isArray(err.details)) setErrors(err.details as string[]);
      else toast.error(err.message ?? "Não foi possível gerar.");
    }
  }

  const est = estimate.data?.estimate;

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 500, damping: 45, mass: 0.9 }}
      className="relative rounded-xl border border-border-strong bg-surface-1 shadow-[0_8px_24px_-12px_oklch(0_0_0/0.25)] transition-colors duration-150 focus-within:border-fg-subtle/60"
      onDragOver={(e) => e.dataTransfer.types.includes("Files") && e.preventDefault()}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        if (!routeFiles(model, Array.from(e.dataTransfer.files))) toast.error("Este modelo não aceita esse tipo de arquivo.");
      }}
    >
      <div className="flex flex-col gap-2.5 p-3 pb-2">
        <ModeSwitcher mode={s.mode} subtype={sub.id} onMode={s.setMode} onSubtype={s.setSubtype} />

        <AnimatePresence initial={false} mode="popLayout">
          {model.slots.length > 0 && (
            <motion.div key={model.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <SlotBar model={model} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <AnimatePresence>
            {slashMatches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute bottom-full left-0 z-30 mb-2 w-72 rounded-lg border border-border-strong bg-surface-1 p-1 shadow-[var(--shadow-pop)]"
                role="listbox"
                aria-label="Comandos"
              >
                {slashMatches.map((c, i) => (
                  <button
                    key={c.cmd}
                    type="button"
                    role="option"
                    aria-selected={i === slashIndex}
                    onMouseDown={(e) => (e.preventDefault(), applySlash(c))}
                    className={cn("flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm", i === slashIndex ? "bg-surface-2 text-fg" : "text-fg-muted")}
                  >
                    <span className="font-mono text-xs text-fg">/{c.cmd}</span>
                    <span className="truncate text-xs">{c.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <label htmlFor="prompt" className="sr-only">
            Prompt
          </label>
          <textarea
            id="prompt"
            ref={textarea}
            value={s.prompt}
            onChange={(e) => s.setPrompt(e.target.value)}
            onPaste={(e) => {
              const files = Array.from(e.clipboardData.files);
              if (files.length && routeFiles(model, files)) e.preventDefault();
            }}
            onKeyDown={(e) => {
              if (slashMatches.length) {
                if (e.key === "ArrowDown") return e.preventDefault(), setSlashIndex((i) => (i + 1) % slashMatches.length);
                if (e.key === "ArrowUp") return e.preventDefault(), setSlashIndex((i) => (i - 1 + slashMatches.length) % slashMatches.length);
                if (e.key === "Enter" || e.key === "Tab") return e.preventDefault(), applySlash(slashMatches[Math.min(slashIndex, slashMatches.length - 1)]);
                if (e.key === "Escape") return s.setPrompt("");
              }
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            maxLength={model.prompt?.maxLength}
            disabled={!model.prompt}
            placeholder={!model.prompt ? "Este modelo não usa prompt" : model.prompt.required ? "Descreva o que gerar. Digite / para comandos." : "Prompt opcional. Digite / para comandos."}
            className="block max-h-60 w-full resize-none bg-transparent px-1 py-1 text-base leading-[22px] text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none disabled:opacity-60"
          />
          <AnimatePresence initial={false}>
            {s.showNegative && model.negativePrompt && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-1 flex items-start gap-2 border-t border-border pt-2">
                  <Minus className="mt-1 size-3.5 shrink-0 text-fg-subtle" strokeWidth={2} />
                  <label htmlFor="negative" className="sr-only">
                    Prompt negativo
                  </label>
                  <input
                    id="negative"
                    value={s.negativePrompt}
                    onChange={(e) => s.setNegative(e.target.value)}
                    maxLength={model.negativePrompt.maxLength}
                    placeholder="O que evitar"
                    className="h-6 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-subtle focus-visible:outline-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {errors.length > 0 && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} role="alert" className="px-1 text-xs text-danger">
              {errors.join(" ")}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-end gap-2 border-t border-border px-3 py-2">
        <div className="-my-1 flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible">
          <ModelPicker mode={s.mode} subtype={sub.id} value={model} onChange={s.setModel} />
          {mainParams.map((p) => (
            <ParamChip key={p.field} p={p} value={params[p.field]} onChange={(v) => s.setParam(p.field, v)} highlight={p.kind === "character" && needsCharacter} />
          ))}
          {model.enhance && (
            <Tooltip content="A Higgsfield reescreve o prompt para melhorar o resultado">
              <button
                type="button"
                aria-pressed={params[model.enhance.field] === true}
                onClick={() => s.setParam(model.enhance!.field, !(params[model.enhance!.field] === true))}
                className={cn(chipClass, params[model.enhance.field] === true && "border-accent/50 bg-accent-soft text-fg")}
              >
                <Wand2 strokeWidth={1.75} />
                Melhorar prompt
              </button>
            </Tooltip>
          )}
          {model.negativePrompt && (
            <button type="button" aria-pressed={s.showNegative} onClick={s.toggleNegative} className={cn(chipClass, s.showNegative && "text-fg")}>
              <Minus strokeWidth={1.75} />
              Negativo
            </button>
          )}
          {advParams.length > 0 && (
            <Popover open={advOpen} onOpenChange={setAdvOpen}>
              <PopoverTrigger className={chipClass} aria-label="Parâmetros avançados">
                <SlidersHorizontal strokeWidth={1.75} />
                Avançado
              </PopoverTrigger>
              <PopoverContent className="w-[min(92vw,320px)] p-1.5" align="end">
                <div className="flex max-h-[60vh] flex-col divide-y divide-border overflow-y-auto">
                  {advParams.map((p) => (
                    <div key={p.field} className="py-1.5">
                      {p.kind === "enum" ? (
                        <details className="group">
                          <summary className="flex h-8 cursor-pointer list-none items-center justify-between rounded-md px-2 text-sm hover:bg-surface-2">
                            <span className="text-fg-muted">{p.label}</span>
                            <span className="truncate pl-3 text-fg">{p.options.find((o) => o.value === params[p.field])?.label ?? "Automático"}</span>
                          </summary>
                          <div className="pl-1 pt-1">
                            <ParamEditor p={p} value={params[p.field]} onChange={(v) => s.setParam(p.field, v)} />
                          </div>
                        </details>
                      ) : (
                        <ParamEditor p={p} value={params[p.field]} onChange={(v) => s.setParam(p.field, v)} />
                      )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Tooltip content={est?.type === "description" ? est.text : "Custo estimado com os parâmetros atuais"}>
            <span className="hidden font-mono text-2xs tabular text-fg-subtle sm:inline" aria-live="polite">
              {estimate.isFetching && !est ? "..." : est?.type === "credits" ? `${formatCredits(est.credits)} cr` : est?.type === "description" ? "custo variável" : ""}
            </span>
          </Tooltip>
          <Tooltip content={hasErrorAttachment ? "Há anexos com erro" : "Gerar"} shortcut="Enter">
            <button
              type="button"
              onClick={submit}
              aria-label="Gerar"
              aria-disabled={!canSubmit}
              className={cn(
                "grid size-8 place-items-center rounded-lg bg-accent text-accent-fg transition-[background-color,opacity,transform] duration-150 hover:bg-accent-hover active:scale-95",
                !canSubmit && "opacity-45",
              )}
            >
              {create.isPending || uploading ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <ArrowUp className="size-4" strokeWidth={2.25} />}
            </button>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
}
