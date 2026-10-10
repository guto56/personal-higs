"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "./button";
import { Tooltip } from "./tooltip";

type Props = Omit<ButtonProps, "children"> & { label: string; icon: React.ReactNode; shortcut?: string; side?: "top" | "bottom" | "left" | "right" };

/** Botão só de ícone: sempre com aria-label e tooltip. */
export const IconButton = forwardRef<HTMLButtonElement, Props>(({ label, icon, shortcut, side, variant = "ghost", size = "icon", ...props }, ref) => (
  <Tooltip content={label} shortcut={shortcut} side={side}>
    <Button ref={ref} aria-label={label} variant={variant} size={size} {...props}>
      {icon}
    </Button>
  </Tooltip>
));
IconButton.displayName = "IconButton";
