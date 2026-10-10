import "server-only";
import type { Asset, Generation, SlotInput } from "@/lib/db/schema";
import { storage } from "./storage";
import type { AssetDTO, GenerationDTO } from "@/lib/types";

export async function assetsToDTO(list: Asset[]): Promise<AssetDTO[]> {
  const urls = await storage.signedUrls(list.map((a) => a.storagePath));
  return list.map((a) => ({
    id: a.id,
    kind: a.kind,
    source: a.source,
    url: urls.get(a.storagePath) ?? "",
    mime: a.mime,
    size: a.size,
    width: a.width,
    height: a.height,
    duration: a.duration,
    fileName: a.fileName,
    favorite: a.favorite,
    generationId: a.generationId,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function generationsToDTO(list: Generation[], assets: Asset[]): Promise<GenerationDTO[]> {
  const dtos = await assetsToDTO(assets);
  const byId = new Map(dtos.map((a) => [a.id, a]));
  return list.map((g) => {
    const inputs: Record<string, AssetDTO[]> = {};
    for (const [field, refs] of Object.entries(g.inputs as Record<string, SlotInput[]>)) {
      inputs[field] = refs.map((r) => byId.get(r.assetId)).filter((a): a is AssetDTO => !!a);
    }
    return {
      id: g.id,
      conversationId: g.conversationId,
      modelId: g.modelId,
      mode: g.mode,
      subtype: g.subtype,
      prompt: g.prompt,
      negativePrompt: g.negativePrompt,
      params: g.params,
      inputs,
      status: g.status,
      error: g.error,
      estimate: g.estimate,
      seed: g.seed,
      parentGenerationId: g.parentGenerationId,
      parentAssetId: g.parentAssetId,
      chainAction: g.chainAction,
      createdAt: g.createdAt.toISOString(),
      startedAt: g.startedAt?.toISOString() ?? null,
      completedAt: g.completedAt?.toISOString() ?? null,
      outputs: dtos.filter((a) => a.generationId === g.id && a.source === "generation").sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };
  });
}
