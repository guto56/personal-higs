"use client";

import * as T from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export function Tooltip({ content, children, side = "top", shortcut }: { content: React.ReactNode; children: React.ReactNode; side?: "top" | "bottom" | "left" | "right"; shortcut?: string }) {
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-50 flex items-center gap-2 rounded-md bg-fg px-2 py-1 text-xs text-bg shadow-[var(--shadow-pop)]",
            "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
          )}
        >
          {content}
          {shortcut && <kbd className="font-mono text-2xs opacity-60">{shortcut}</kbd>}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
