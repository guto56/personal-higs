"use client";

import { getModel, valueLabel } from "@/lib/catalog";
import type { GenerationDTO } from "@/lib/types";
import { MediaThumb } from "@/components/media/media-thumb";
import { useUI } from "@/lib/client/ui-store";

/** Chips curtos dos parâmetros principais usados. */
export function paramSummary(g: GenerationDTO) {
  const model = getModel(g.modelId);
  if (!model) return [];
  const out: string[] = [];
  for (const p of model.params) {
    if (p.group !== "main") continue;
    const v = g.params[p.field];
    if (v === undefined || v === null || v === "") continue;
    if (p.kind === "seed" || p.kind === "style" || p.kind === "preset" || p.kind === "character") continue;
    if (p.kind === "boolean") {
      if (v === true) out.push(p.label);
      continue;
    }
    if (p.kind === "enum" && (p.field === "sound" || p.field === "keep_original_sound")) {
      if (v === p.options[0].value) out.push("Com áudio");
      continue;
    }
    out.push(p.kind === "enum" ? (p.options.find((o) => o.value === v)?.label ?? String(v)) : typeof v === "number" || typeof v === "string" ? valueLabel(p.field, v) : "");
  }
  if (g.params.custom_reference_id) out.push("Personagem");
  if (g.params.style_id) out.push("Estilo");
  if (g.params.preset_id) out.push("Preset");
  if (model.enhance && g.params[model.enhance.field] === true) out.push("Prompt melhorado");
  return out.filter(Boolean);
}

export function UserMessage({ g }: { g: GenerationDTO }) {
  const inputs = Object.values(g.inputs).flat();
  const openLightbox = useUI((s) => s.openLightbox);
  const chips = paramSummary(g);
  return (
    <div className="ml-auto flex max-w-[88%] flex-col items-end gap-1.5 sm:max-w-[72%]">
      {inputs.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1.5">
          {inputs.map((a, i) => (
            <button key={`${a.id}-${i}`} type="button" onClick={() => openLightbox(inputs.map((asset) => ({ asset })), i)} className="rounded-md" aria-label="Ver anexo">
              <MediaThumb asset={a} className="size-14" rounded />
            </button>
          ))}
        </div>
      )}
      {(g.prompt || g.negativePrompt) && (
        <div className="rounded-xl bg-surface-2 px-3.5 py-2 text-base text-fg">
          <p className="whitespace-pre-wrap break-words">{g.prompt}</p>
          {g.negativePrompt && <p className="mt-1 border-t border-border pt-1 text-sm text-fg-muted">Evitar: {g.negativePrompt}</p>}
        </div>
      )}
      {chips.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1">
          {chips.map((c, i) => (
            <span key={i} className="rounded-sm border border-border px-1.5 py-px text-2xs text-fg-subtle">
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
