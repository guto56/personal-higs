"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AssetDTO, GenerationDTO } from "@/lib/types";

export interface LightboxItem {
  asset: AssetDTO;
  generation?: GenerationDTO;
  /** Mídia de entrada para comparação antes/depois (edições). */
  before?: AssetDTO | null;
}

interface UIState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  paletteOpen: boolean;
  lightbox: { items: LightboxItem[]; index: number } | null;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setMobileNav: (v: boolean) => void;
  setPalette: (v: boolean) => void;
  openLightbox: (items: LightboxItem[], index: number) => void;
  closeLightbox: () => void;
  stepLightbox: (d: number) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      paletteOpen: false,
      lightbox: null,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNav: (v) => set({ mobileNavOpen: v }),
      setPalette: (v) => set({ paletteOpen: v }),
      openLightbox: (items, index) => set({ lightbox: { items, index } }),
      closeLightbox: () => set({ lightbox: null }),
      stepLightbox: (d) =>
        set((s) => (s.lightbox ? { lightbox: { ...s.lightbox, index: (s.lightbox.index + d + s.lightbox.items.length) % s.lightbox.items.length } } : s)),
    }),
    { name: "studio-ui", storage: createJSONStorage(() => localStorage), partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }) },
  ),
);

export function setTheme(t: "light" | "dark" | "system") {
  try {
    if (t === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", t);
  } catch {}
  const resolved = t === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : t;
  document.documentElement.dataset.theme = resolved;
}

export function getThemePref(): "light" | "dark" | "system" {
  try {
    const t = localStorage.getItem("theme");
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}
