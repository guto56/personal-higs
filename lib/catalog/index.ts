import raw from "./generated/catalog.json";
import { buildModel, type RawModel } from "./build";
import { MODE_LABELS, SUBTYPE_LABELS, SUBTYPE_ORDER } from "./overrides";
import type { Mode, ModeDef, ModelDef, ParamDef } from "./types";

export * from "./types";
export { valueLabel } from "./overrides";

const data = raw as unknown as { syncedAt: string; models: RawModel[] };

export const CATALOG_SYNCED_AT = data.syncedAt;

export const MODELS: ModelDef[] = data.models.map(buildModel).filter((m): m is ModelDef => m !== null);

const byId = new Map(MODELS.map((m) => [m.id, m]));

export function getModel(id: string | null | undefined): ModelDef | undefined {
  return id ? byId.get(id) : undefined;
}

export function modelsFor(mode: Mode, subtype: string): ModelDef[] {
  return MODELS.filter((m) => m.uses.some((u) => u.mode === mode && u.subtype === subtype));
}

/** Modos e subtipos que têm pelo menos um modelo disponível na conta. O que a API não oferece não aparece. */
export const MODES: ModeDef[] = (Object.keys(SUBTYPE_ORDER) as Mode[])
  .map((id) => ({
    id,
    label: MODE_LABELS[id],
    subtypes: SUBTYPE_ORDER[id]
      .filter((s) => modelsFor(id, s.id).length > 0)
      .map((s) => {
        const list = modelsFor(id, s.id);
        return {
          id: s.id,
          label: SUBTYPE_LABELS[`${id}/${s.id}`] ?? s.id,
          defaultModel: list.some((m) => m.id === s.defaultModel) ? s.defaultModel : list[0].id,
        };
      }),
  }))
  .filter((m) => m.subtypes.length > 0);

export function getMode(id: Mode) {
  return MODES.find((m) => m.id === id);
}

/** Valores iniciais dos parâmetros conforme os padrões da API. */
export function defaultParams(model: ModelDef): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const p of model.params) if (p.default !== undefined && p.default !== null) out[p.field] = p.default;
  if (model.enhance) out[model.enhance.field] = model.enhance.default;
  return out;
}

/** Mantém apenas valores válidos para o modelo (ao trocar de modelo, o que não se aplica some). */
export function sanitizeParams(model: ModelDef, values: Record<string, unknown>): Record<string, unknown> {
  const out = defaultParams(model);
  for (const p of model.params) {
    const v = values[p.field];
    if (v === undefined || v === null || v === "") continue;
    if (isValidValue(p, v)) out[p.field] = v;
  }
  if (model.enhance && typeof values[model.enhance.field] === "boolean") out[model.enhance.field] = values[model.enhance.field];
  return out;
}

export function isValidValue(p: ParamDef, v: unknown): boolean {
  switch (p.kind) {
    case "enum":
      return p.options.some((o) => o.value === v);
    case "range":
      return typeof v === "number" && v >= p.min && v <= p.max;
    case "seed":
      return typeof v === "number" && Number.isInteger(v) && v >= p.min && v <= p.max;
    case "boolean":
      return typeof v === "boolean";
    default:
      return typeof v === "string";
  }
}

/** Ações encadeadas possíveis a partir de uma saída. */
export interface ChainAction {
  id: string;
  label: string;
  mode: Mode;
  subtype: string;
  slotKind: "image" | "video";
}

export const CHAIN_ACTIONS: ChainAction[] = [
  { id: "animate", label: "Animar esta imagem", mode: "video", subtype: "image", slotKind: "image" },
  { id: "first-frame", label: "Usar como primeiro frame", mode: "video", subtype: "frames", slotKind: "image" },
  { id: "edit-image", label: "Editar imagem", mode: "edit", subtype: "image", slotKind: "image" },
  { id: "reference-video", label: "Usar como referência de vídeo", mode: "video", subtype: "reference", slotKind: "image" },
  { id: "motion-character", label: "Personagem para motion", mode: "video", subtype: "motion", slotKind: "image" },
  { id: "extend", label: "Estender vídeo", mode: "edit", subtype: "extend", slotKind: "video" },
  { id: "restyle", label: "Restyle", mode: "edit", subtype: "restyle", slotKind: "video" },
  { id: "edit-video", label: "Editar vídeo", mode: "edit", subtype: "video", slotKind: "video" },
].filter((a) => MODES.some((m) => m.id === a.mode && m.subtypes.some((s) => s.id === a.subtype)));

/** Escolhe o slot que recebe a mídia encadeada. */
export function slotForChain(model: ModelDef, kind: "image" | "video") {
  return model.slots.find((s) => s.kind === kind && s.required) ?? model.slots.find((s) => s.kind === kind);
}
