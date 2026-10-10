"use client";

import * as S from "@radix-ui/react-slider";

export function Slider({ value, min, max, step, onChange, label }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string }) {
  return (
    <S.Root className="relative flex h-5 w-full touch-none select-none items-center" value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} aria-label={label}>
      <S.Track className="relative h-1 grow overflow-hidden rounded-full bg-surface-3">
        <S.Range className="absolute h-full bg-accent" />
      </S.Track>
      <S.Thumb className="block size-3.5 rounded-full border border-border-strong bg-fg shadow transition-transform duration-150 focus-visible:scale-110" />
    </S.Root>
  );
}
