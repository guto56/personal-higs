/** Tipos compartilhados entre servidor e cliente (respostas da API interna). */

export type GenerationStatus = "queued" | "processing" | "completed" | "failed" | "canceled" | "nsfw";

export interface AssetDTO {
  id: string;
  kind: "image" | "video" | "audio";
  source: "upload" | "generation";
  url: string;
  mime: string;
  size: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  fileName: string | null;
  favorite: boolean;
  generationId: string | null;
  createdAt: string;
}

export interface GenerationDTO {
  id: string;
  conversationId: string;
  modelId: string;
  mode: string;
  subtype: string;
  prompt: string;
  negativePrompt: string | null;
  params: Record<string, unknown>;
  inputs: Record<string, AssetDTO[]>;
  status: GenerationStatus;
  error: string | null;
  estimate: { credits?: number; usd?: number; text?: string } | null;
  seed: number | null;
  parentGenerationId: string | null;
  parentAssetId: string | null;
  chainAction: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  outputs: AssetDTO[];
}

export interface ConversationDTO {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export const TERMINAL: GenerationStatus[] = ["completed", "failed", "canceled", "nsfw"];
