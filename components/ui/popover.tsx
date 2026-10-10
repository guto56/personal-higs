"use client";

import * as P from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "motion/react";
import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

const Ctx = createContext(false);

export function Popover({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (o: boolean) => void }) {
  const [inner, setInner] = useState(false);
  const isOpen = open ?? inner;
  return (
    <Ctx.Provider value={isOpen}>
      <P.Root open={isOpen} onOpenChange={(o) => (onOpenChange ? onOpenChange(o) : setInner(o))}>
        {children}
      </P.Root>
    </Ctx.Provider>
  );
}

export const PopoverTrigger = P.Trigger;
export const PopoverClose = P.Close;
export const PopoverAnchor = P.Anchor;

export function PopoverContent({
  children,
  className,
  align = "start",
  side = "top",
  sideOffset = 8,
  ...rest
}: { children: React.ReactNode; className?: string; align?: "start" | "center" | "end"; side?: "top" | "bottom" | "left" | "right"; sideOffset?: number } & Omit<
  P.PopoverContentProps,
  "asChild"
>) {
  const open = useContext(Ctx);
  return (
    <AnimatePresence>
      {open && (
        <P.Portal forceMount>
          <P.Content forceMount asChild align={align} side={side} sideOffset={sideOffset} collisionPadding={12} {...rest}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: side === "top" ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
              transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
              style={{ transformOrigin: "var(--radix-popover-content-transform-origin)" }}
              className={cn("z-50 rounded-lg border border-border-strong bg-surface-1 p-1 shadow-[var(--shadow-pop)] outline-none", className)}
            >
              {children}
            </motion.div>
          </P.Content>
        </P.Portal>
      )}
    </AnimatePresence>
  );
}
