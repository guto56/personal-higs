"use client";

import * as D from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  hideClose,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  hideClose?: boolean;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <D.Portal forceMount>
            <D.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </D.Overlay>
            <D.Content asChild forceMount aria-describedby={description ? undefined : undefined}>
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.12 } }}
                transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
                className={cn(
                  "fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-24px)] max-w-lg -translate-x-1/2 rounded-xl border border-border-strong bg-surface-1 shadow-[var(--shadow-pop)] outline-none",
                  className,
                )}
              >
                <D.Title className={cn("text-lg font-medium", hideClose && "sr-only", "px-5 pt-4")}>{title}</D.Title>
                {description ? <D.Description className="px-5 pt-1 text-sm text-fg-muted">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
                {!hideClose && (
                  <D.Close aria-label="Fechar" className="absolute right-3 top-3 rounded-md p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-fg">
                    <X className="size-4" strokeWidth={1.75} />
                  </D.Close>
                )}
                {children}
              </motion.div>
            </D.Content>
          </D.Portal>
        )}
      </AnimatePresence>
    </D.Root>
  );
}
