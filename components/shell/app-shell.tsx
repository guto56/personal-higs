"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu as MenuIcon, PanelLeftOpen, Plus, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUI } from "@/lib/client/ui-store";
import { useGenerationPoller } from "@/lib/client/queries";
import { IconButton } from "@/components/ui/icon-button";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";
import { Lightbox } from "@/components/media/lightbox";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

function useOnline() {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const toggle = useUI((s) => s.toggleSidebar);
  const mobileOpen = useUI((s) => s.mobileNavOpen);
  const setMobile = useUI((s) => s.setMobileNav);
  const setPalette = useUI((s) => s.setPalette);
  const pathname = usePathname();
  const router = useRouter();
  const online = useOnline();
  useGenerationPoller();

  useEffect(() => setMobile(false), [pathname, setMobile]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(!useUI.getState().paletteOpen);
      } else if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        router.push("/");
        window.dispatchEvent(new Event("studio:new"));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, setPalette, toggle]);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop */}
      <div
        className={cn("hidden shrink-0 overflow-hidden border-r border-border transition-[width,border-color] duration-250 ease-[var(--ease-out)] lg:block", collapsed ? "w-0 border-transparent" : "w-[260px]")}
        aria-hidden={collapsed}
        inert={collapsed}
      >
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-overlay lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobile(false)} />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 border-r border-border shadow-[var(--shadow-pop)] lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 500, damping: 45 }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              <Sidebar onNavigate={() => setMobile(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Topo mobile */}
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-2 lg:hidden">
          <IconButton label="Abrir menu" icon={<MenuIcon strokeWidth={1.75} />} onClick={() => setMobile(true)} />
          <span className="text-sm font-medium">Studio</span>
          <IconButton
            label="Nova"
            icon={<Plus strokeWidth={1.75} />}
            onClick={() => {
              router.push("/");
              window.dispatchEvent(new Event("studio:new"));
            }}
          />
        </header>
        {collapsed && (
          <div className="absolute left-2 top-2 z-20 hidden lg:block">
            <IconButton label="Mostrar barra lateral" shortcut="Ctrl B" icon={<PanelLeftOpen strokeWidth={1.75} />} onClick={toggle} />
          </div>
        )}
        <AnimatePresence>
          {!online && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              role="status"
              className="flex shrink-0 items-center justify-center gap-2 overflow-hidden bg-danger-soft text-xs text-danger"
            >
              <span className="flex items-center gap-2 py-1.5">
                <WifiOff className="size-3.5" strokeWidth={1.75} />
                Sem conexão. Tentando reconectar.
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <main className="relative min-h-0 flex-1">{children}</main>
      </div>

      <CommandPalette />
      <Lightbox />
    </div>
  );
}
