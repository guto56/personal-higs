CREATE SCHEMA IF NOT EXISTS "studio";
--> statement-breakpoint
CREATE TYPE "studio"."generation_status" AS ENUM('queued', 'processing', 'completed', 'failed', 'canceled', 'nsfw');--> statement-breakpoint
CREATE TYPE "studio"."media_kind" AS ENUM('image', 'video', 'audio');--> statement-breakpoint
CREATE TABLE "studio"."assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "studio"."media_kind" NOT NULL,
	"source" text NOT NULL,
	"generation_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"storage_path" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer,
	"width" integer,
	"height" integer,
	"duration" real,
	"file_name" text,
	"original_url" text,
	"uploaded" boolean DEFAULT false NOT NULL,
	"favorite" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio"."characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hf_reference_id" text,
	"name" text NOT NULL,
	"model_version" text DEFAULT 'v2' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"error" text,
	"input_asset_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"thumbnail_asset_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio"."conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT 'Nova conversa' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio"."generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"model_id" text NOT NULL,
	"mode" text NOT NULL,
	"subtype" text NOT NULL,
	"prompt" text DEFAULT '' NOT NULL,
	"negative_prompt" text,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"request_body" jsonb,
	"status" "studio"."generation_status" DEFAULT 'queued' NOT NULL,
	"hf_request_id" text,
	"error" text,
	"estimate" jsonb,
	"seed" integer,
	"parent_generation_id" uuid,
	"parent_asset_id" uuid,
	"chain_action" text,
	"ingest_started_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"last_polled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio"."settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio"."generations" ADD CONSTRAINT "generations_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "studio"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_generation_idx" ON "studio"."assets" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "assets_created_idx" ON "studio"."assets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "conversations_updated_idx" ON "studio"."conversations" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "generations_conversation_idx" ON "studio"."generations" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "generations_status_idx" ON "studio"."generations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "generations_hf_idx" ON "studio"."generations" USING btree ("hf_request_id");--> statement-breakpoint
CREATE INDEX "generations_prompt_search_idx" ON "studio"."generations" USING gin (to_tsvector('simple', "prompt"));