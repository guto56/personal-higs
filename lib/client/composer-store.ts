"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { defaultParams, getMode, getModel, MODES, modelsFor, sanitizeParams, type MediaKind, type Mode } from "@/lib/catalog";

export interface Attachment {
  localId: string;
  field: string;
  kind: MediaKind;
  status: "uploading" | "ready" | "error";
  progress: number;
  assetId?: string;
  previewUrl: string;
  fileName: string;
  size?: number;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  error?: string;
}

export interface ChainContext {
  parentGenerationId: string | null;
  parentAssetId: string | null;
  action: string | null;
}

interface ComposerState {
  mode: Mode;
  subtypeByMode: Partial<Record<Mode, string>>;
  modelBySub: Record<string, string>;
  paramsByModel: Record<string, Record<string, unknown>>;
  prompt: string;
  negativePrompt: string;
  showNegative: boolean;
  attachments: Attachment[];
  chain: ChainContext | null;
  focusToken: number;

  setMode: (m: Mode) => void;
  setSubtype: (s: string) => void;
  setModel: (id: string) => void;
  setParam: (field: string, v: unknown) => void;
  setPrompt: (p: string) => void;
  setNegative: (p: string) => void;
  toggleNegative: () => void;
  addAttachment: (a: Attachment) => void;
  updateAttachment: (localId: string, patch: Partial<Attachment>) => void;
  removeAttachment: (localId: string) => void;
  clearAfterSubmit: () => void;
  /** Carrega uma configuração completa (reutilizar, encadear, preset). */
  load: (cfg: { mode: Mode; subtype: string; modelId?: string; params?: Record<string, unknown>; prompt?: string; negativePrompt?: string | null; attachments?: Attachment[]; chain?: ChainContext | null }) => void;
  focus: () => void;
}

const firstMode = MODES[0];

export function currentSubtype(s: Pick<ComposerState, "mode" | "subtypeByMode">) {
  const mode = getMode(s.mode) ?? firstMode;
  const sub = s.subtypeByMode[mode.id];
  return mode.subtypes.find((x) => x.id === sub) ?? mode.subtypes[0];
}

export function currentModel(s: Pick<ComposerState, "mode" | "subtypeByMode" | "modelBySub">) {
  const sub = currentSubtype(s);
  const list = modelsFor(s.mode, sub.id);
  const chosen = s.modelBySub[`${s.mode}/${sub.id}`];
  return getModel(list.some((m) => m.id === chosen) ? chosen : sub.defaultModel) ?? list[0];
}

export function currentParams(s: Pick<ComposerState, "mode" | "subtypeByMode" | "modelBySub" | "paramsByModel">) {
  const model = currentModel(s);
  return sanitizeParams(model, s.paramsByModel[model.id] ?? defaultParams(model));
}

/** Remove anexos de campos que o novo modelo não aceita. */
function keepCompatible(attachments: Attachment[], modelId: string) {
  const model = getModel(modelId);
  if (!model) return [];
  const out: Attachment[] = [];
  for (const a of attachments) {
    const slot = model.slots.find((s) => s.field === a.field && s.kind === a.kind) ?? model.slots.find((s) => s.kind === a.kind && !out.some((o) => o.field === s.field && !s.multiple));
    if (slot) out.push({ ...a, field: slot.field });
  }
  return out;
}

export const useComposer = create<ComposerState>()(
  persist(
    (set, get) => ({
      mode: firstMode.id,
      subtypeByMode: {},
      modelBySub: {},
      paramsByModel: {},
      prompt: "",
      negativePrompt: "",
      showNegative: false,
      attachments: [],
      chain: null,
      focusToken: 0,

      setMode: (mode) => {
        set({ mode });
        const m = currentModel({ ...get(), mode });
        set((s) => ({ attachments: keepCompatible(s.attachments, m.id) }));
      },
      setSubtype: (sub) => {
        set((s) => ({ subtypeByMode: { ...s.subtypeByMode, [s.mode]: sub } }));
        const m = currentModel(get());
        set((s) => ({ attachments: keepCompatible(s.attachments, m.id) }));
      },
      setModel: (id) => {
        const s = get();
        const sub = currentSubtype(s);
        const prev = currentParams(s);
        const model = getModel(id);
        if (!model) return;
        set({
          modelBySub: { ...s.modelBySub, [`${s.mode}/${sub.id}`]: id },
          // Leva junto o que for compatível (ex.: proporção) e descarta o resto.
          paramsByModel: { ...s.paramsByModel, [id]: sanitizeParams(model, { ...prev, ...(s.paramsByModel[id] ?? {}) }) },
          attachments: keepCompatible(s.attachments, id),
        });
      },
      setParam: (field, v) => {
        const s = get();
        const model = currentModel(s);
        const params = { ...currentParams(s) };
        if (v === undefined || v === null || v === "") delete params[field];
        else params[field] = v;
        set({ paramsByModel: { ...s.paramsByModel, [model.id]: params } });
      },
      setPrompt: (prompt) => set({ prompt }),
      setNegative: (negativePrompt) => set({ negativePrompt }),
      toggleNegative: () => set((s) => ({ showNegative: !s.showNegative })),
      addAttachment: (a) => set((s) => ({ attachments: [...s.attachments, a] })),
      updateAttachment: (id, patch) => set((s) => ({ attachments: s.attachments.map((a) => (a.localId === id ? { ...a, ...patch } : a)) })),
      removeAttachment: (id) => set((s) => ({ attachments: s.attachments.filter((a) => a.localId !== id) })),
      clearAfterSubmit: () => set({ prompt: "", negativePrompt: "", attachments: [], chain: null }),
      load: (cfg) => {
        const s = get();
        const subKey = `${cfg.mode}/${cfg.subtype}`;
        const modelBySub = cfg.modelId ? { ...s.modelBySub, [subKey]: cfg.modelId } : s.modelBySub;
        const next = { mode: cfg.mode, subtypeByMode: { ...s.subtypeByMode, [cfg.mode]: cfg.subtype }, modelBySub };
        const model = currentModel(next);
        set({
          ...next,
          paramsByModel: cfg.params ? { ...s.paramsByModel, [model.id]: sanitizeParams(model, cfg.params) } : s.paramsByModel,
          prompt: cfg.prompt ?? s.prompt,
          negativePrompt: cfg.negativePrompt ?? "",
          showNegative: !!cfg.negativePrompt,
          attachments: cfg.attachments ? keepCompatible(cfg.attachments, model.id) : keepCompatible(s.attachments, model.id),
          chain: cfg.chain ?? null,
          focusToken: s.focusToken + 1,
        });
      },
      focus: () => set((s) => ({ focusToken: s.focusToken + 1 })),
    }),
    {
      name: "studio-composer",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ mode: s.mode, subtypeByMode: s.subtypeByMode, modelBySub: s.modelBySub, paramsByModel: s.paramsByModel, showNegative: s.showNegative }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ComposerState>;
        const mode = MODES.some((m) => m.id === p.mode) ? (p.mode as Mode) : current.mode;
        return { ...current, ...p, mode };
      },
    },
  ),
);
