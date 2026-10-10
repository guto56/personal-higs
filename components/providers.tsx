"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Toaster } from "sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, refetchOnWindowFocus: false, retry: (n, e) => n < 2 && (e as { status?: number }).status !== 401 && (e as { status?: number }).status !== 404 },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}>
        <Tooltip.Provider delayDuration={350} skipDelayDuration={150}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "!bg-surface-2 !text-fg !border !border-border-strong !rounded-[10px] !shadow-[var(--shadow-pop)] !text-[13px] !font-sans",
            }}
          />
        </Tooltip.Provider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
