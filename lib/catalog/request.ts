import { isValidValue, type ModelDef } from "./index";

export interface RequestDraft {
  prompt: string;
  negativePrompt?: string;
  params: Record<string, unknown>;
  /** URLs públicas por campo de slot. */
  inputs: Record<string, string[]>;
}

export type BuildResult = { ok: true; body: Record<string, unknown> } | { ok: false; errors: string[] };

/** Monta o corpo da requisição para a Higgsfield e valida contra o schema do catálogo. */
export function buildRequestBody(model: ModelDef, draft: RequestDraft): BuildResult {
  const errors: string[] = [];
  const body: Record<string, unknown> = {};
  const prompt = draft.prompt.trim();

  if (model.prompt) {
    if (prompt) body.prompt = model.prompt.maxLength ? prompt.slice(0, model.prompt.maxLength) : prompt;
    else if (model.prompt.required) errors.push("Escreva um prompt.");
    // Alguns modelos exigem prompt mesmo quando o schema não marca (ex.: Kling 3.0).
    else if (model.schema.properties?.multi_prompt) errors.push("Escreva um prompt.");
  }
  if (model.negativePrompt && draft.negativePrompt?.trim()) body.negative_prompt = draft.negativePrompt.trim();

  for (const slot of model.slots) {
    const urls = draft.inputs[slot.field] ?? [];
    if (slot.required && urls.length === 0) {
      errors.push(`Anexe: ${slot.label}.`);
      continue;
    }
    if (urls.length === 0) continue;
    if (slot.multiple) {
      if (urls.length < slot.min) errors.push(`${slot.label}: mínimo de ${slot.min} arquivo(s).`);
      if (urls.length > slot.max) errors.push(`${slot.label}: máximo de ${slot.max} arquivo(s).`);
      body[slot.field] = urls.slice(0, slot.max);
    } else {
      body[slot.field] = urls[0];
    }
  }

  for (const p of model.params) {
    const v = draft.params[p.field];
    if (v === undefined || v === null || v === "") {
      if (p.required && p.default === undefined) errors.push(`Defina: ${p.label}.`);
      continue;
    }
    if (!isValidValue(p, v)) {
      errors.push(`Valor inválido para ${p.label}.`);
      continue;
    }
    body[p.field] = v;
  }

  if (model.enhance) {
    const v = draft.params[model.enhance.field];
    if (typeof v === "boolean") body[model.enhance.field] = v;
  }

  // Regras condicionais documentadas (allOf/if/then).
  for (const rule of model.schema.allOf ?? []) {
    const cond = rule.if?.properties ?? {};
    const applies = Object.entries(cond).every(([k, c]) => c.const === undefined || body[k] === c.const);
    if (!applies || !rule.then) continue;
    for (const req of rule.then.required ?? []) {
      if (body[req] === undefined) errors.push(`Com essa opção, preencha também: ${labelOf(model, req)}.`);
    }
    for (const [k, c] of Object.entries(rule.then.properties ?? {})) {
      if (c.const !== undefined && body[k] !== undefined && body[k] !== c.const) body[k] = c.const;
      if (Array.isArray(body[k]) && c.maxItems !== undefined && (body[k] as unknown[]).length > c.maxItems) {
        errors.push(`${labelOf(model, k)}: máximo de ${c.maxItems} com essa opção.`);
      }
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, body };
}

function labelOf(model: ModelDef, field: string) {
  return model.slots.find((s) => s.field === field)?.label ?? model.params.find((p) => p.field === field)?.label ?? field;
}
