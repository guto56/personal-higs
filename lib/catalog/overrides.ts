import type { Mode, ModelUse } from "./types";

/**
 * Ajustes editoriais por modelo. Tudo que vem da API (campos, limites, padrões)
 * é derivado do schema; aqui ficam apenas classificação e textos de interface.
 */

export const MODE_LABELS: Record<Mode, string> = {
  image: "Imagem",
  video: "Vídeo",
  audio: "Áudio",
  edit: "Editar",
  apps: "Apps",
};

export const SUBTYPE_LABELS: Record<string, string> = {
  "image/text": "Texto",
  "image/character": "Personagem",
  "video/text": "Texto",
  "video/image": "Imagem",
  "video/frames": "Primeiro + último frame",
  "video/reference": "Referências",
  "video/motion": "Motion",
  "edit/image": "Imagem",
  "edit/video": "Vídeo",
  "edit/restyle": "Restyle",
  "edit/extend": "Estender vídeo",
  "apps/ads": "Anúncios",
  "apps/marketing": "Marketing",
  "apps/cinema": "Cinema",
};

/** Ordem de exibição dos subtipos e modelo padrão de cada um (o mais barato que atende bem). */
export const SUBTYPE_ORDER: Record<Mode, { id: string; defaultModel: string }[]> = {
  image: [
    { id: "text", defaultModel: "higgsfield-ai/soul/v2/standard" },
    { id: "character", defaultModel: "higgsfield-ai/soul/v2/standard" },
  ],
  video: [
    { id: "text", defaultModel: "kling-video/v2.5-turbo/pro/text-to-video" },
    { id: "image", defaultModel: "kling-video/v2.5-turbo/standard/image-to-video" },
    { id: "frames", defaultModel: "kling-video/omni/first-last-frame" },
    { id: "reference", defaultModel: "kling-video/o3/image-reference" },
    { id: "motion", defaultModel: "kling-video/motion-control/std" },
  ],
  audio: [],
  edit: [
    { id: "image", defaultModel: "alibaba/qwen-image-3/edit" },
    { id: "video", defaultModel: "kling-video/omni/video-edit" },
    { id: "restyle", defaultModel: "higgsfield/genjutsu/restyle/v1.0" },
    { id: "extend", defaultModel: "bytedance/seedance-2.5/video-extend" },
  ],
  apps: [
    { id: "ads", defaultModel: "higgsfield/ads-studio/v1.0" },
    { id: "marketing", defaultModel: "marketing-studio/image" },
    { id: "cinema", defaultModel: "higgsfield/cinema-studio/4.0" },
  ],
};

/** Descrição curta por família (exibida no seletor de modelo). */
export const FAMILY_DESCRIPTIONS: Record<string, string> = {
  "SOUL V2": "Fotorrealismo da Higgsfield, com estilos e personagens.",
  SOUL: "Primeira geração Soul, com estilos e personagens.",
  "Qwen Image 3": "Geração e edição de imagem com bom texto.",
  "Grok Image 2.0": "Gera e edita a partir de até 10 imagens.",
  "Ideogram 4.0": "Forte em tipografia e layouts.",
  "Recraft V4.1": "Ilustração e design com paleta controlada.",
  "Recraft V4.1 Pro": "Recraft em 2k.",
  "Recraft V4.1 Utility": "Recraft para peças utilitárias.",
  "Recraft V4.1 Utility Pro": "Recraft utilitário em 2k.",
  "Z-Image Turbo": "Imagem rápida e barata.",
  "Marketing Studio Image": "Peças de produto e campanha com presets.",
  "Ads Studio": "Gera conceitos de anúncio a partir de um briefing.",
  "Cinema Studio 4.0": "Direção cinematográfica com câmera, lente e paleta.",
  "Kling 3.0": "Vídeo com áudio nativo e controle de frames.",
  "Kling 2.6": "Vídeo com áudio nativo.",
  "Kling 2.5 Turbo": "Vídeo rápido e econômico.",
  "Kling O3": "Referências, frames e edição de vídeo.",
  "Kling Omni": "Referências, frames e edição de vídeo.",
  "Kling 3.0 Motion Control": "Aplica o movimento de um vídeo a um personagem.",
  "Kling 2.6 Motion Control": "Aplica o movimento de um vídeo a um personagem.",
  "Seedance 2.5": "Vídeo longo (até 30s), edição e extensão.",
  "Seedance 2.0": "Vídeo até 4k com referências.",
  "Wan 3.0": "Vídeo longo com áudio, até 30s.",
  "Wan 3.0 Prime": "Wan 3.0 com mais qualidade.",
  "Wan 2.7": "Vídeo com áudio de entrada opcional.",
  "Wan 2.6": "Vídeo com multi-shot e áudio.",
  "Happy Horse 1.0": "Vídeo da Alibaba em 720p/1080p.",
  "HappyHorse 1.1": "Happy Horse em 1080p.",
  "MiniMax H3": "Vídeo em 2K com referências.",
  "Hailuo 2.3": "Vídeo econômico em 768p.",
  "LTX-2.5": "Vídeo até 4k com movimentos de câmera.",
  "PixVerse V6": "Vídeo com áudio, de 360p a 1080p.",
  "Grok Imagine Video 1.5": "Vídeo a partir de referências.",
  Genjutsu: "Transferência de movimento, troca de objeto e restyle.",
};

/** Classificação por slug. Regra geral nos padrões; exceções explícitas. */
export function classify(slug: string, operation: string[], fields: string[]): ModelUse[] {
  const has = (f: string) => fields.includes(f);
  if (slug === "higgsfield/ads-studio/v1.0") return [{ mode: "apps", subtype: "ads" }];
  if (slug.startsWith("marketing-studio/")) return [{ mode: "apps", subtype: "marketing" }];
  if (slug === "higgsfield/cinema-studio/4.0") return [{ mode: "apps", subtype: "cinema" }];
  if (slug.includes("genjutsu/motion-transfer")) return [{ mode: "video", subtype: "motion" }];
  if (slug.includes("genjutsu/object-swap")) return [{ mode: "edit", subtype: "video" }];
  if (slug.includes("genjutsu/restyle")) return [{ mode: "edit", subtype: "restyle" }];
  if (slug.includes("motion-control")) return [{ mode: "video", subtype: "motion" }];
  if (slug.endsWith("/video-extend")) return [{ mode: "edit", subtype: "extend" }];
  if (slug.endsWith("/video-edit")) return [{ mode: "edit", subtype: "video" }];
  if (slug.endsWith("/first-last-frame")) return [{ mode: "video", subtype: "frames" }];
  if (/reference-to-video|image-reference|video-reference/.test(slug)) return [{ mode: "video", subtype: "reference" }];
  if (slug.includes("text-to-video")) return [{ mode: "video", subtype: "text" }];
  if (slug.includes("image-to-video")) {
    const uses: ModelUse[] = [{ mode: "video", subtype: "image" }];
    if (has("end_image_url") || has("last_image_url")) uses.push({ mode: "video", subtype: "frames" });
    return uses;
  }
  if (slug === "soul-id") return [];
  const uses: ModelUse[] = [];
  if (operation.includes("text2image")) uses.push({ mode: "image", subtype: "text" });
  if (has("custom_reference_id")) uses.push({ mode: "image", subtype: "character" });
  if (operation.includes("image_edit")) uses.push({ mode: "edit", subtype: "image" });
  return uses;
}

/** Rótulos dos slots de anexo conforme o campo e o contexto do modelo. */
export function slotLabel(field: string, slug: string, fields: string[]): { label: string; hint?: string } {
  const motion = slug.includes("motion-control") || slug.includes("motion-transfer");
  switch (field) {
    case "image_url":
      if (motion) return { label: "Personagem", hint: "Imagem de quem vai executar o movimento" };
      if (fields.includes("end_image_url") || fields.includes("last_image_url")) return { label: "Frame inicial" };
      if (slug.startsWith("ideogram")) return { label: "Imagem de referência" };
      if (slug.includes("grok-imagine-video")) return { label: "Imagem principal" };
      return { label: "Imagem" };
    case "first_frame_url":
      return { label: "Frame inicial" };
    case "end_image_url":
    case "last_image_url":
    case "last_frame_url":
      return { label: "Frame final" };
    case "image_reference_url":
      return { label: "Referência de estilo", hint: "Guia a melhoria do prompt" };
    case "video_url":
      if (motion) return { label: "Vídeo de movimento", hint: "Mínimo de 4 segundos; acima de 30s é cortado" };
      if (slug.endsWith("/video-extend")) return { label: "Vídeo a estender" };
      return { label: "Vídeo de origem", hint: slug.includes("genjutsu") ? "Mínimo de 4 segundos, até 200 MB" : undefined };
    case "video_urls":
      if (slug.endsWith("/video-edit") || slug.endsWith("/video-reference")) return { label: "Vídeo de origem" };
      return { label: "Vídeos de referência" };
    case "image_urls":
      if (slug.includes("genjutsu/restyle")) return { label: "Personagens", hint: "Opcional: guia a aparência das pessoas" };
      if (slug.includes("genjutsu")) return { label: "Personagens e objetos" };
      if (slug.startsWith("marketing-studio")) return { label: "Produto e referências", hint: "Produto primeiro; pessoa em seguida" };
      if (slug === "higgsfield/ads-studio/v1.0") return { label: "Produto e marca" };
      if (/edit|grok-imagine-image|qwen/.test(slug)) return { label: "Imagens" };
      return { label: "Referências" };
    case "audio_url":
      return { label: "Áudio" };
    case "audio_urls":
      return { label: "Áudios de referência" };
    default:
      return { label: field };
  }
}

type FieldInfo = { label: string; group: "main" | "advanced"; unit?: string };

export const FIELD_INFO: Record<string, FieldInfo> = {
  aspect_ratio: { label: "Proporção", group: "main" },
  resolution: { label: "Resolução", group: "main" },
  duration: { label: "Duração", group: "main", unit: "s" },
  batch_size: { label: "Quantidade", group: "main" },
  quality: { label: "Qualidade", group: "main" },
  mode: { label: "Modo", group: "main" },
  sound: { label: "Áudio", group: "main" },
  generate_audio: { label: "Áudio", group: "main" },
  seed: { label: "Seed", group: "main" },
  style_id: { label: "Estilo", group: "main" },
  preset_id: { label: "Preset", group: "main" },
  custom_reference_id: { label: "Personagem", group: "main" },
  camera_movement: { label: "Câmera", group: "main" },
  rendering_speed: { label: "Velocidade", group: "main" },
  fps: { label: "FPS", group: "advanced" },
  cfg_scale: { label: "Aderência ao prompt", group: "advanced" },
  style_strength: { label: "Força do estilo", group: "advanced" },
  custom_reference_strength: { label: "Força do personagem", group: "advanced" },
  image_weight: { label: "Peso da imagem", group: "advanced" },
  bitrate_mode: { label: "Bitrate", group: "advanced" },
  output_format: { label: "Formato", group: "advanced" },
  moderation: { label: "Moderação", group: "advanced" },
  keep_original_sound: { label: "Manter áudio original", group: "advanced" },
  character_orientation: { label: "Orientação do personagem", group: "advanced" },
  aigc_watermark: { label: "Marca d'água de IA", group: "advanced" },
  enable_thinking: { label: "Raciocínio estendido", group: "advanced" },
  prompt_extend_mode: { label: "Modo de expansão", group: "advanced" },
  shot_type: { label: "Tipo de plano", group: "advanced" },
  era: { label: "Época", group: "advanced" },
  genre: { label: "Gênero", group: "advanced" },
  light: { label: "Luz", group: "advanced" },
  pacing: { label: "Ritmo", group: "advanced" },
  camera_lens: { label: "Lente", group: "advanced" },
  camera_model: { label: "Câmera (corpo)", group: "advanced" },
  camera_aperture: { label: "Abertura", group: "advanced" },
  color_palette: { label: "Paleta de cor", group: "advanced" },
  niche: { label: "Nicho", group: "advanced" },
  language: { label: "Idioma", group: "advanced" },
  target_audience: { label: "Público-alvo", group: "advanced" },
};

/** Campos que não viram controle (tratados à parte ou sem suporte de criação na API). */
export const SKIPPED_FIELDS = new Set([
  "prompt",
  "negative_prompt",
  "enhance_prompt",
  "prompt_optimizer",
  "prompt_extend",
  "multi_prompt",
  "multi_shots",
  "elements",
  "colors",
  "background_color",
  "file_url",
  "link_url",
]);

export const ENHANCE_FIELDS = ["enhance_prompt", "prompt_optimizer", "prompt_extend"];

const VALUE_LABELS: Record<string, string> = {
  on: "Ligado",
  off: "Desligado",
  yes: "Sim",
  no: "Não",
  std: "Standard",
  pro: "Pro",
  "4k": "4K",
  auto: "Automático",
  adaptive: "Adaptativo",
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  xhigh: "Muito alta",
  max: "Máxima",
  standard: "Padrão",
  image: "Da imagem",
  video: "Do vídeo",
  customize: "Personalizado",
  intelligent: "Inteligente",
  direct: "Direto",
  agent: "Agente",
  TURBO: "Turbo",
  DEFAULT: "Padrão",
  QUALITY: "Qualidade",
};

export function valueLabel(field: string, v: string | number): string {
  if (field === "duration" && typeof v === "number") return `${v}s`;
  if (field === "fps") return `${v} fps`;
  if (field === "batch_size") return `${v}x`;
  if (typeof v === "number") return String(v);
  if (field === "quality" && v === "low") return "Baixa";
  if (VALUE_LABELS[v]) return VALUE_LABELS[v];
  if (/^\d+(\.\d+)?:\d+(\.\d+)?$/.test(v) || /^\d+[pk]$/i.test(v)) return v.toUpperCase().replace("P", "p");
  return v.replace(/[-_]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
