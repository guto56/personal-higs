"use client";

import * as M from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const Menu = M.Root;
export const MenuTrigger = M.Trigger;
export const MenuSub = M.Sub;

export function MenuContent({ children, className, align = "end", side = "bottom" }: { children: React.ReactNode; className?: string; align?: "start" | "end" | "center"; side?: "top" | "bottom" }) {
  return (
    <M.Portal>
      <M.Content
        align={align}
        side={side}
        sideOffset={6}
        collisionPadding={12}
        className={cn("z-50 min-w-48 rounded-lg border border-border-strong bg-surface-1 p-1 shadow-[var(--shadow-pop)] outline-none", className)}
      >
        {children}
      </M.Content>
    </M.Portal>
  );
}

export function MenuItem({ children, onSelect, icon, danger, disabled }: { children: React.ReactNode; onSelect?: () => void; icon?: React.ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <M.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        "flex h-8 cursor-default select-none items-center gap-2 rounded-md px-2 text-sm text-fg outline-none data-[disabled]:opacity-40 data-[highlighted]:bg-surface-2 [&_svg]:size-4 [&_svg]:text-fg-muted",
        danger && "text-danger [&_svg]:text-danger",
      )}
    >
      {icon}
      {children}
    </M.Item>
  );
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <M.Label className="px-2 pb-1 pt-1.5 text-2xs text-fg-subtle">{children}</M.Label>;
}

export function MenuSeparator() {
  return <M.Separator className="my-1 h-px bg-border" />;
}

export function MenuSubTrigger({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <M.SubTrigger className="flex h-8 cursor-default select-none items-center gap-2 rounded-md px-2 text-sm text-fg outline-none data-[highlighted]:bg-surface-2 data-[state=open]:bg-surface-2 [&_svg]:size-4 [&_svg]:text-fg-muted">
      {icon}
      {children}
    </M.SubTrigger>
  );
}

export function MenuSubContent({ children }: { children: React.ReactNode }) {
  return (
    <M.Portal>
      <M.SubContent sideOffset={4} collisionPadding={12} className="z-50 min-w-48 rounded-lg border border-border-strong bg-surface-1 p-1 shadow-[var(--shadow-pop)] outline-none">
        {children}
      </M.SubContent>
    </M.Portal>
  );
}
