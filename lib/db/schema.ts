import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgSchema, real, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const studio = pgSchema("studio");

export const generationStatus = studio.enum("generation_status", ["queued", "processing", "completed", "failed", "canceled", "nsfw"]);
export const mediaKind = studio.enum("media_kind", ["image", "video", "audio"]);

export const conversations = studio.table(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull().default("Nova conversa"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("conversations_updated_idx").on(t.updatedAt)],
);

/** Uma entrada de mídia no Storage: upload do usuário ou saída de geração. */
export const assets = studio.table(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: mediaKind("kind").notNull(),
    source: text("source", { enum: ["upload", "generation"] }).notNull(),
    generationId: uuid("generation_id"),
    position: integer("position").notNull().default(0),
    storagePath: text("storage_path").notNull(),
    mime: text("mime").notNull(),
    size: integer("size"),
    width: integer("width"),
    height: integer("height"),
    duration: real("duration"),
    fileName: text("file_name"),
    originalUrl: text("original_url"),
    uploaded: boolean("uploaded").notNull().default(false),
    favorite: boolean("favorite").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("assets_generation_idx").on(t.generationId), index("assets_created_idx").on(t.createdAt)],
);

export type SlotInput = { assetId: string; kind: "image" | "video" | "audio" };

export const generations = studio.table(
  "generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    modelId: text("model_id").notNull(),
    mode: text("mode").notNull(),
    subtype: text("subtype").notNull(),
    prompt: text("prompt").notNull().default(""),
    negativePrompt: text("negative_prompt"),
    params: jsonb("params").$type<Record<string, unknown>>().notNull().default({}),
    inputs: jsonb("inputs").$type<Record<string, SlotInput[]>>().notNull().default({}),
    requestBody: jsonb("request_body").$type<Record<string, unknown>>(),
    status: generationStatus("status").notNull().default("queued"),
    hfRequestId: text("hf_request_id"),
    error: text("error"),
    estimate: jsonb("estimate").$type<{ credits?: number; usd?: number; text?: string } | null>(),
    seed: integer("seed"),
    parentGenerationId: uuid("parent_generation_id"),
    parentAssetId: uuid("parent_asset_id"),
    chainAction: text("chain_action"),
    ingestStartedAt: timestamp("ingest_started_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    lastPolledAt: timestamp("last_polled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("generations_conversation_idx").on(t.conversationId, t.createdAt),
    index("generations_status_idx").on(t.status),
    index("generations_hf_idx").on(t.hfRequestId),
    index("generations_prompt_search_idx").using("gin", sql`to_tsvector('simple', ${t.prompt})`),
  ],
);

/** Personagens (Soul ID / custom references). */
export const characters = studio.table("characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  hfReferenceId: text("hf_reference_id"),
  name: text("name").notNull(),
  modelVersion: text("model_version").notNull().default("v2"),
  status: text("status").notNull().default("queued"),
  error: text("error"),
  inputAssetIds: jsonb("input_asset_ids").$type<string[]>().notNull().default([]),
  thumbnailAssetId: uuid("thumbnail_asset_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Configurações simples chave/valor (modelos padrão, tema, última config por modo). */
export const settings = studio.table("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Conversation = typeof conversations.$inferSelect;
export type Generation = typeof generations.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Character = typeof characters.$inferSelect;
