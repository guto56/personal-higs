"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn, formatCredits } from "@/lib/utils";
import { modelsFor, type Mode, type ModelDef } from "@/lib/catalog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { chipClass } from "./param-chip";

export function costLabel(m: ModelDef) {
  if (m.estimate?.type === "credits") return `${formatCredits(m.estimate.credits)} cr`;
  if (m.estimate?.type === "description") return "variável";
  return "";
}

export function ModelPicker({ mode, subtype, value, onChange }: { mode: Mode; subtype: string; value: ModelDef; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const list = modelsFor(mode, subtype);
  const groups = useMemo(() => {
    const f = list.filter((m) => !q || `${m.name} ${m.family} ${m.id}`.toLowerCase().includes(q.toLowerCase()));
    const map = new Map<string, ModelDef[]>();
    for (const m of f) map.set(m.family, [...(map.get(m.family) ?? []), m]);
    return [...map.entries()];
  }, [list, q]);

  return (
    <Popover open={open} onOpenChange={(o) => (setOpen(o), o || setQ(""))}>
      <PopoverTrigger className={cn(chipClass, "text-fg")} aria-label={`Modelo: ${value.name}`}>
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
        <span className="truncate font-medium">{value.name}</span>
        <ChevronDown className="!size-3 opacity-60" strokeWidth={2} />
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 text-fg-subtle" strokeWidth={1.75} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar modelo" aria-label="Buscar modelo" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-subtle" />
          <span className="font-mono text-2xs text-fg-subtle">{list.length}</span>
        </div>
        <div className="max-h-[min(56vh,420px)] overflow-y-auto p-1" role="listbox" aria-label="Modelos">
          {groups.length === 0 && <p className="px-3 py-6 text-center text-sm text-fg-subtle">Nenhum modelo.</p>}
          {groups.map(([family, models]) => (
            <div key={family} className="mb-1">
              {models.length > 1 && (
                <div className="flex items-baseline justify-between gap-2 px-2 pb-0.5 pt-2">
                  <span className="text-2xs text-fg-subtle">{family}</span>
                </div>
              )}
              {models.map((m) => {
                const active = m.id === value.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                      setQ("");
                    }}
                    className={cn("flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-2", active && "bg-surface-2")}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-fg">{m.name}</span>
                      {m.description && <span className="block truncate text-xs text-fg-subtle">{m.description}</span>}
                    </span>
                    <span className="mt-0.5 shrink-0 font-mono text-2xs text-fg-muted">{costLabel(m)}</span>
                    <Check className={cn("mt-0.5 size-3.5 shrink-0 text-accent", !active && "invisible")} strokeWidth={2} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
