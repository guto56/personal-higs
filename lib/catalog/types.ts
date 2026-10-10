export type Mode = "image" | "video" | "audio" | "edit" | "apps";
export type MediaKind = "image" | "video" | "audio";

export type JsonSchema = {
  type?: string;
  enum?: (string | number)[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  format?: string;
  items?: JsonSchema;
  anyOf?: JsonSchema[];
  const?: unknown;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  allOf?: { if?: JsonSchema; then?: JsonSchema }[];
  if?: JsonSchema;
  then?: JsonSchema;
};

export type Estimate =
  | { type: "credits"; credits: number; usd: number }
  | { type: "description"; text: string }
  | { type: "unavailable" }
  | null;

/** Slot de anexo gerado a partir de um campo de URL do schema. */
export interface SlotDef {
  field: string;
  label: string;
  kind: MediaKind;
  multiple: boolean;
  min: number;
  max: number;
  required: boolean;
  hint?: string;
}

interface ParamBase {
  field: string;
  label: string;
  group: "main" | "advanced";
  default?: unknown;
  required: boolean;
}

export type ParamDef =
  | (ParamBase & { kind: "enum"; options: { value: string | number; label: string }[] })
  | (ParamBase & { kind: "range"; min: number; max: number; step: number; unit?: string; integer: boolean })
  | (ParamBase & { kind: "boolean"; onLabel?: string })
  | (ParamBase & { kind: "seed"; min: number; max: number })
  | (ParamBase & { kind: "text"; maxLength?: number; multiline?: boolean })
  | (ParamBase & { kind: "style"; source: "soul-v1" | "soul-v2" })
  | (ParamBase & { kind: "preset"; source: "genjutsu-restyle" | "marketing-studio" })
  | (ParamBase & { kind: "character"; version: "v1" | "v2" | "cinema" });

export type ParamKind = ParamDef["kind"];

export interface ModelUse {
  mode: Mode;
  subtype: string;
}

export interface ModelDef {
  id: string;
  /** Caminho do endpoint de submissão (sem barra inicial). */
  path: string;
  name: string;
  family: string;
  tier: string;
  description: string;
  output: MediaKind;
  uses: ModelUse[];
  prompt: { required: boolean; maxLength?: number } | null;
  negativePrompt: { maxLength?: number } | null;
  enhance: { field: string; default: boolean; trueValue: unknown; falseValue: unknown } | null;
  slots: SlotDef[];
  params: ParamDef[];
  estimate: Estimate;
  schema: JsonSchema;
}

export interface SubtypeDef {
  id: string;
  label: string;
  /** Modelo padrão sugerido (o usuário pode trocar; a escolha é lembrada). */
  defaultModel: string;
}

export interface ModeDef {
  id: Mode;
  label: string;
  subtypes: SubtypeDef[];
}
