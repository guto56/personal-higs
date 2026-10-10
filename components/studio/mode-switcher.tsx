"use client";

import { LayoutGroup, motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { MODES, type Mode } from "@/lib/catalog";

export function ModeSwitcher({ mode, subtype, onMode, onSubtype }: { mode: Mode; subtype: string; onMode: (m: Mode) => void; onSubtype: (s: string) => void }) {
  const id = useId();
  const current = MODES.find((m) => m.id === mode) ?? MODES[0];

  function onKey(e: React.KeyboardEvent, list: string[], value: string, set: (v: string) => void) {
    const i = list.indexOf(value);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      set(list[(i + 1) % list.length]);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      set(list[(i - 1 + list.length) % list.length]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <LayoutGroup id={`mode-${id}`}>
        <div
          role="radiogroup"
          aria-label="Modo"
          className="relative flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-lg bg-surface-2 p-0.5"
          onKeyDown={(e) => onKey(e, MODES.map((m) => m.id), mode, (v) => onMode(v as Mode))}
        >
          {MODES.map((m) => {
            const active = m.id === mode;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => onMode(m.id)}
                className={cn("relative h-7 shrink-0 rounded-md px-3 text-sm transition-colors duration-150", active ? "text-fg" : "text-fg-muted hover:text-fg")}
              >
                {active && (
                  <motion.span
                    layoutId="mode-indicator"
                    className="absolute inset-0 rounded-md border border-border-strong bg-surface-1 shadow-[0_1px_2px_oklch(0_0_0/0.12)]"
                    transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
                  />
                )}
                <span className="relative">{m.label}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      {current.subtypes.length > 1 && (
        <div
          role="radiogroup"
          aria-label="Tipo"
          className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]"
          onKeyDown={(e) => onKey(e, current.subtypes.map((s) => s.id), subtype, onSubtype)}
        >
          {current.subtypes.map((s) => {
            const active = s.id === subtype;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => onSubtype(s.id)}
                className={cn(
                  "h-6 shrink-0 rounded-md border px-2 text-xs transition-colors duration-150",
                  active ? "border-accent/50 bg-accent-soft text-fg" : "border-transparent text-fg-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
