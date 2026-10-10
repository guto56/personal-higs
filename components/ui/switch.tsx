"use client";

import * as S from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({ checked, onCheckedChange, id, label }: { checked: boolean; onCheckedChange: (v: boolean) => void; id?: string; label?: string }) {
  return (
    <S.Root
      id={id}
      aria-label={label}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn("relative h-[18px] w-[30px] shrink-0 rounded-full border border-border-strong bg-surface-3 transition-colors duration-150", "data-[state=checked]:border-transparent data-[state=checked]:bg-accent")}
    >
      <S.Thumb className="block size-3.5 translate-x-[1px] rounded-full bg-fg shadow transition-transform duration-150 ease-[var(--ease-out)] data-[state=checked]:translate-x-[13px] data-[state=checked]:bg-accent-fg" />
    </S.Root>
  );
}
