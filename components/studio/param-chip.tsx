"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, ChevronDown, Clapperboard, Clock, Dices, Gauge, Layers, Palette, RectangleHorizontal, Ruler, Sparkles, UserRound, Video, Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { valueLabel, type ParamDef } from "@/lib/catalog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

const ICONS: Record<string, typeof Clock> = {
  aspect_ratio: RectangleHorizontal,
  resolution: Ruler,
  duration: Clock,
  batch_size: Layers,
  quality: Gauge,
  mode: Gauge,
  sound: Volume2,
  generate_audio: Volume2,
  seed: Dices,
  style_id: Palette,
  preset_id: Sparkles,
  custom_reference_id: UserRound,
  camera_movement: Video,
  rendering_speed: Gauge,
};

export const chipClass =
  "inline-flex h-7 max-w-56 shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2 text-xs text-fg-muted transition-colors duration-150 hover:border-border-strong hover:text-fg data-[state=open]:border-border-strong data-[state=open]:text-fg [&_svg]:size-3.5 [&_svg]:shrink-0";

function Ratio({ value }: { value: string }) {
  const m = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(value);
  if (!m) return <RectangleHorizontal strokeWidth={1.75} />;
  const w = Number(m[1]);
  const h = Number(m[2]);
  const s = 12 / Math.max(w, h);
  return <span aria-hidden className="inline-block shrink-0 rounded-[2px] border-[1.5px] border-current" style={{ width: Math.max(4, w * s), height: Math.max(4, h * s) }} />;
}

type Remote = { id: string; name: string; preview: string | null; description?: string; group?: string | null; status?: string; version?: string; thumbnail?: string | null };

function useRemoteOptions(p: ParamDef, enabled: boolean) {
  return useQuery({
    queryKey: ["param-options", p.kind, p.kind === "style" ? p.source : p.kind === "preset" ? p.source : p.kind === "character" ? p.version : ""],
    enabled: enabled && (p.kind === "style" || p.kind === "preset" || p.kind === "character"),
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<Remote[]> => {
      if (p.kind === "style") return (await api<{ items: Remote[] }>(`/api/catalog/styles?version=${p.source === "soul-v2" ? "v2" : "v1"}`)).items;
      if (p.kind === "preset") return (await api<{ items: Remote[] }>(`/api/catalog/presets?source=${p.source}`)).items;
      const r = await api<{ characters: (Remote & { referenceId: string })[] }>("/api/characters");
      return r.characters.filter((c) => c.status === "completed" && c.referenceId && (p.kind !== "character" || c.version === p.version)).map((c) => ({ ...c, id: c.referenceId, preview: c.thumbnail ?? null }));
    },
  });
}

function GalleryPicker({ p, value, onChange, close }: { p: ParamDef; value: unknown; onChange: (v: unknown) => void; close: () => void }) {
  const { data, isLoading, isError } = useRemoteOptions(p, true);
  const [q, setQ] = useState("");
  const list = (data ?? []).filter((o) => !q || o.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="flex w-[min(92vw,420px)] flex-col">
      <div className="flex items-center gap-2 border-b border-border px-2 pb-1.5 pt-1">
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Buscar ${p.label.toLowerCase()}`} aria-label={`Buscar ${p.label}`} className="h-7 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-subtle" />
        {value != null && value !== "" && !p.required && (
          <button type="button" onClick={() => (onChange(undefined), close())} className="flex items-center gap-1 text-xs text-fg-subtle hover:text-fg">
            <X className="size-3" /> Limpar
          </button>
        )}
      </div>
      <div className="max-h-[340px] overflow-y-auto p-1.5">
        {isLoading && (
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="shimmer aspect-[4/5] rounded-md" />
            ))}
          </div>
        )}
        {isError && <p className="px-2 py-4 text-sm text-fg-subtle">Não foi possível carregar.</p>}
        {!isLoading && !isError && list.length === 0 && (
          <p className="px-2 py-4 text-sm text-fg-subtle">{p.kind === "character" ? "Nenhum personagem pronto. Crie um em Personagens." : "Nada encontrado."}</p>
        )}
        <div className="grid grid-cols-3 gap-1.5">
          {list.map((o) => {
            const active = value === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => (onChange(o.id), close())}
                className={cn("group relative flex flex-col overflow-hidden rounded-md border text-left", active ? "border-accent" : "border-transparent hover:border-border-strong")}
              >
                <div className="aspect-[4/5] w-full bg-surface-2">
                  {o.preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.preview} alt="" loading="lazy" className="size-full object-cover" />
                  )}
                </div>
                <span className="truncate px-1 py-1 text-2xs text-fg-muted group-hover:text-fg">{o.name}</span>
                {active && (
                  <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-accent text-accent-fg">
                    <Check className="size-3" strokeWidth={2.5} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Corpo de edição de um parâmetro (reutilizado no chip e no painel Avançado). */
export function ParamEditor({ p, value, onChange, close }: { p: ParamDef; value: unknown; onChange: (v: unknown) => void; close?: () => void }) {
  if (p.kind === "enum") {
    return (
      <div role="listbox" aria-label={p.label} className="flex max-h-[320px] min-w-40 flex-col overflow-y-auto">
        {p.options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={String(o.value)}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => (onChange(o.value), close?.())}
              className={cn("flex h-8 items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-surface-2", active ? "text-fg" : "text-fg-muted")}
            >
              {p.field === "aspect_ratio" && typeof o.value === "string" && <Ratio value={o.value} />}
              <span className="flex-1">{o.label}</span>
              {active && <Check className="size-3.5 text-accent" strokeWidth={2} />}
            </button>
          );
        })}
      </div>
    );
  }
  if (p.kind === "range") {
    const v = typeof value === "number" ? value : typeof p.default === "number" ? p.default : p.min;
    return (
      <div className="flex w-60 flex-col gap-2 p-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-fg-muted">{p.label}</span>
          <span className="font-mono tabular text-fg">
            {p.integer ? v : v.toFixed(2)}
            {p.unit ?? ""}
          </span>
        </div>
        <Slider value={v} min={p.min} max={p.max} step={p.step} onChange={onChange} label={p.label} />
        <div className="flex justify-between font-mono text-2xs text-fg-subtle">
          <span>
            {p.min}
            {p.unit ?? ""}
          </span>
          <span>
            {p.max}
            {p.unit ?? ""}
          </span>
        </div>
      </div>
    );
  }
  if (p.kind === "seed") {
    return (
      <div className="flex w-60 flex-col gap-2 p-2">
        <label className="text-xs text-fg-muted" htmlFor="seed-input">
          Seed (vazio = aleatória)
        </label>
        <div className="flex gap-1.5">
          <input
            id="seed-input"
            inputMode="numeric"
            value={typeof value === "number" ? String(value) : ""}
            onChange={(e) => {
              const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
              onChange(Number.isFinite(n) ? Math.min(p.max, Math.max(p.min, n)) : undefined);
            }}
            placeholder="Aleatória"
            className="h-8 min-w-0 flex-1 rounded-md border border-border-strong bg-bg px-2 font-mono text-sm outline-none focus-visible:border-accent"
          />
          <button type="button" aria-label="Sortear seed" onClick={() => onChange(Math.floor(p.min + Math.random() * Math.min(p.max - p.min, 999_999)))} className="grid size-8 place-items-center rounded-md border border-border hover:bg-surface-2">
            <Dices className="size-4 text-fg-muted" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    );
  }
  if (p.kind === "boolean") {
    return (
      <label className="flex h-8 items-center justify-between gap-6 rounded-md px-2 text-sm text-fg">
        {p.label}
        <Switch checked={value === true} onCheckedChange={onChange} label={p.label} />
      </label>
    );
  }
  if (p.kind === "text") {
    return (
      <div className="flex w-72 flex-col gap-1.5 p-2">
        <label className="text-xs text-fg-muted">{p.label}</label>
        <textarea
          value={typeof value === "string" ? value : ""}
          maxLength={p.maxLength}
          onChange={(e) => onChange(e.target.value || undefined)}
          rows={p.multiline ? 4 : 2}
          className="resize-none rounded-md border border-border-strong bg-bg px-2 py-1.5 text-sm outline-none focus-visible:border-accent"
        />
      </div>
    );
  }
  return <GalleryPicker p={p} value={value} onChange={onChange} close={close ?? (() => {})} />;
}

function display(p: ParamDef, value: unknown, remoteName?: string) {
  if (value === undefined || value === null || value === "") {
    if (p.kind === "seed") return "Aleatória";
    if (p.kind === "character") return "Personagem";
    if (p.kind === "style" || p.kind === "preset") return "Padrão";
    return "Padrão";
  }
  if (p.kind === "enum") return p.options.find((o) => o.value === value)?.label ?? String(value);
  if (p.kind === "boolean") return value ? "Ligado" : "Desligado";
  if (p.kind === "range") return `${p.integer ? value : (value as number).toFixed(2)}${p.unit ?? ""}`;
  if (p.kind === "style" || p.kind === "preset" || p.kind === "character") return remoteName ?? "Selecionado";
  if (typeof value === "string" || typeof value === "number") return valueLabel(p.field, value);
  return "";
}

export function ParamChip({ p, value, onChange, highlight }: { p: ParamDef; value: unknown; onChange: (v: unknown) => void; highlight?: boolean }) {
  const [open, setOpen] = useState(false);
  const remote = useRemoteOptions(p, value != null && value !== "");
  const remoteName = remote.data?.find((o) => o.id === value)?.name;
  const Icon = ICONS[p.field] ?? Clapperboard;

  // Áudio liga/desliga direto, sem popover.
  if (p.kind === "enum" && p.options.length === 2 && (p.field === "sound" || p.field === "keep_original_sound")) {
    const on = p.options[0].value;
    const off = p.options[1].value;
    const isOn = value === on;
    return (
      <button type="button" aria-pressed={isOn} onClick={() => onChange(isOn ? off : on)} className={cn(chipClass, isOn && "text-fg")} aria-label={`${p.label}: ${isOn ? "ligado" : "desligado"}`}>
        <Icon strokeWidth={1.75} />
        {isOn ? "Com áudio" : "Sem áudio"}
      </button>
    );
  }
  if (p.kind === "boolean" && p.group === "main") {
    return (
      <button type="button" aria-pressed={value === true} onClick={() => onChange(!(value === true))} className={cn(chipClass, value === true && "text-fg")} aria-label={`${p.label}: ${value ? "ligado" : "desligado"}`}>
        <Icon strokeWidth={1.75} />
        {value ? "Com áudio" : "Sem áudio"}
      </button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(chipClass, highlight && "border-accent/60 text-fg")} aria-label={`${p.label}: ${display(p, value, remoteName)}`}>
        {p.field === "aspect_ratio" && typeof value === "string" ? <Ratio value={value} /> : <Icon strokeWidth={1.75} />}
        <span className="truncate">{p.kind === "seed" && typeof value === "number" ? <span className="font-mono">{value}</span> : display(p, value, remoteName)}</span>
        <ChevronDown className="!size-3 opacity-60" strokeWidth={2} />
      </PopoverTrigger>
      <PopoverContent>
        <ParamEditor p={p} value={value} onChange={onChange} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
