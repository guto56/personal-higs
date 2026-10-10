import type { Estimate, JsonSchema, MediaKind, ModelDef, ParamDef, SlotDef } from "./types";
import { classify, ENHANCE_FIELDS, FAMILY_DESCRIPTIONS, FIELD_INFO, SKIPPED_FIELDS, slotLabel, valueLabel } from "./overrides";

export interface RawModel {
  slug: string;
  path: string | null;
  docTitle: string | null;
  operationType: string[];
  outputType: string;
  estimate: Estimate;
  schema: JsonSchema;
}

const URL_FIELD = /(_url|_urls)$/;

function typeOf(s: JsonSchema): string | undefined {
  if (s.type) return s.type;
  return s.anyOf?.find((x) => x.type && x.type !== "null")?.type;
}

function mediaKindOf(field: string): MediaKind {
  if (field.includes("video")) return "video";
  if (field.includes("audio")) return "audio";
  return "image";
}

/** Campos exigidos condicionalmente (ex.: `if: {required: ["image_urls"]}` usado como "obrigatório" na prática). */
function conditionallyRequired(schema: JsonSchema): Set<string> {
  const out = new Set<string>();
  if (schema.if && !schema.if.properties && schema.if.required) for (const f of schema.if.required) out.add(f);
  return out;
}

function splitTitle(docTitle: string | null, slug: string) {
  const title = (docTitle ?? slug).replace(/\s+API$/, "");
  const [familyRaw, variantRaw = ""] = title.split(/\s+[—–-]\s+/);
  const family = familyRaw.trim();
  const tier = variantRaw
    .replace(/·/g, " ")
    .replace(/\b(Text to (image|video)|Image to video|Reference to video|First last frame|Video edit|Video extend|Edit images|Generate and edit|Generate ads|Generate|Create character|image to video|text to video)\b/gi, "")
    .replace(/\bImage reference\b/i, "Ref. imagem")
    .replace(/\bVideo reference\b/i, "Ref. vídeo")
    .replace(/\bMotion transfer\b/i, "Motion")
    .replace(/\bObject swap\b/i, "Troca de objeto")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[a-z]/, (c) => c.toUpperCase());
  return { family, tier };
}

function buildParam(field: string, s: JsonSchema, required: boolean): ParamDef | null {
  const info = FIELD_INFO[field] ?? { label: field.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()), group: "advanced" as const };
  const base = { field, label: info.label, group: info.group, default: s.default, required };
  const t = typeOf(s);

  if (field === "seed") return { ...base, kind: "seed", min: s.minimum ?? 0, max: s.maximum ?? 2147483647 };
  if (field === "style_id") return { ...base, kind: "style", source: "soul-v1" };
  if (field === "preset_id") return { ...base, kind: "preset", source: "marketing-studio" };
  if (field === "custom_reference_id") return { ...base, kind: "character", version: "v2" };
  if (s.enum) {
    return { ...base, kind: "enum", options: s.enum.map((v) => ({ value: v, label: valueLabel(field, v) })) };
  }
  if (t === "boolean") return { ...base, kind: "boolean" };
  if ((t === "integer" || t === "number") && s.minimum !== undefined && s.maximum !== undefined) {
    const integer = t === "integer";
    const step = s.multipleOf ?? (integer ? 1 : (s.maximum - s.minimum) / 100);
    return { ...base, kind: "range", min: s.minimum, max: s.maximum, step, integer, unit: info.unit };
  }
  if (t === "string") return { ...base, kind: "text", maxLength: s.maxLength, multiline: (s.maxLength ?? 0) > 200 };
  return null;
}

export function buildModel(raw: RawModel): ModelDef | null {
  const schema = raw.schema;
  const props = schema.properties ?? {};
  const fields = Object.keys(props);
  const uses = classify(raw.slug, raw.operationType, fields);
  if (uses.length === 0) return null;

  const required = new Set([...(schema.required ?? []), ...conditionallyRequired(schema)]);
  const { family, tier } = splitTitle(raw.docTitle, raw.slug);

  const slots: SlotDef[] = [];
  const params: ParamDef[] = [];
  let enhance: ModelDef["enhance"] = null;

  for (const [field, s] of Object.entries(props)) {
    if (URL_FIELD.test(field) && !SKIPPED_FIELDS.has(field)) {
      const multiple = typeOf(s) === "array";
      const { label, hint } = slotLabel(field, raw.slug, fields);
      slots.push({
        field,
        label,
        hint,
        kind: mediaKindOf(field),
        multiple,
        min: multiple ? (s.minItems ?? 0) : 0,
        max: multiple ? (s.maxItems ?? 9) : 1,
        required: required.has(field),
      });
      continue;
    }
    if (ENHANCE_FIELDS.includes(field) && !enhance) {
      enhance = { field, default: s.default === true, trueValue: true, falseValue: false };
      continue;
    }
    if (SKIPPED_FIELDS.has(field)) continue;
    const p = buildParam(field, s, required.has(field));
    if (p) params.push(p);
  }

  // Soul: estilo e personagem dependem da versão do modelo.
  for (const p of params) {
    if (p.kind === "style") p.source = raw.slug.includes("/v2/") ? "soul-v2" : "soul-v1";
    if (p.kind === "character") p.version = raw.slug.includes("/v2/") ? "v2" : raw.slug.includes("cinema") ? "cinema" : "v1";
    if (p.kind === "preset") p.source = raw.slug.includes("genjutsu") ? "genjutsu-restyle" : "marketing-studio";
  }

  // Slots obrigatórios primeiro, depois a ordem do schema.
  slots.sort((a, b) => Number(b.required) - Number(a.required));
  // Ordem estável dos parâmetros principais.
  const order = ["custom_reference_id", "style_id", "preset_id", "aspect_ratio", "resolution", "duration", "batch_size", "quality", "mode", "sound", "generate_audio", "camera_movement", "rendering_speed", "seed"];
  params.sort((a, b) => {
    const ia = order.indexOf(a.field);
    const ib = order.indexOf(b.field);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  const promptSchema = props.prompt;
  const neg = props.negative_prompt;

  return {
    id: raw.slug,
    path: raw.path ?? raw.slug,
    name: [family, tier].filter(Boolean).join(" "),
    family,
    tier,
    description: FAMILY_DESCRIPTIONS[family] ?? "",
    output: (raw.outputType as MediaKind) ?? "image",
    uses,
    prompt: promptSchema ? { required: required.has("prompt"), maxLength: promptSchema.maxLength } : null,
    negativePrompt: neg ? { maxLength: neg.maxLength } : null,
    enhance,
    slots,
    params,
    estimate: raw.estimate,
    schema,
  };
}
