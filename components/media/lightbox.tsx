"use client";

import * as D from "@radix-ui/react-dialog";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Columns2, Download, ExternalLink, X } from "lucide-react";
import { useUI } from "@/lib/client/ui-store";
import { getModel } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { VideoPlayer } from "./video-player";

function Compare({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const move = (x: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={ref}
      className="relative max-h-full max-w-full touch-none select-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => e.buttons && move(e.clientX)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="Depois" className="block max-h-[calc(100dvh-140px)] max-w-full object-contain" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={before} alt="Antes" className="absolute inset-0 size-full object-contain" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} draggable={false} />
      <div className="absolute inset-y-0 w-px bg-white/90" style={{ left: `${pos}%` }}>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Comparar antes e depois"
          aria-valuenow={Math.round(pos)}
          aria-valuemin={0}
          aria-valuemax={100}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
            if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
          }}
          className="absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow"
        >
          <Columns2 className="size-4" strokeWidth={1.75} />
        </div>
      </div>
      <span className="absolute left-2 top-2 rounded-sm bg-black/55 px-1.5 py-0.5 text-2xs text-white">Antes</span>
      <span className="absolute right-2 top-2 rounded-sm bg-black/55 px-1.5 py-0.5 text-2xs text-white">Depois</span>
    </div>
  );
}

export function Lightbox() {
  const lb = useUI((s) => s.lightbox);
  const close = useUI((s) => s.closeLightbox);
  const step = useUI((s) => s.stepLightbox);
  const [compareAt, setCompareAt] = useState<number | null>(null);
  const item = lb ? lb.items[lb.index] : null;
  const compare = !!lb && compareAt === lb.index;
  const setCompare = (fn: (c: boolean) => boolean) => setCompareAt(fn(compare) && lb ? lb.index : null);

  useEffect(() => {
    if (!lb) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.getAttribute?.("role") === "slider") return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lb, step]);

  const model = getModel(item?.generation?.modelId);
  const canCompare = item?.asset.kind === "image" && item.before?.kind === "image";

  return (
    <D.Root open={!!lb} onOpenChange={(o) => !o && close()}>
      <AnimatePresence>
        {lb && item && (
          <D.Portal forceMount>
            <D.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-bg/96 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </D.Overlay>
            <D.Content asChild forceMount>
              <motion.div className="fixed inset-0 z-50 flex flex-col outline-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <D.Title className="sr-only">Visualização</D.Title>
                <D.Description className="sr-only">Use as setas para navegar e Esc para fechar.</D.Description>
                <div className="flex h-14 shrink-0 items-center gap-2 px-3">
                  <div className="min-w-0 flex-1">
                    {model && <p className="truncate text-sm text-fg">{model.name}</p>}
                    {item.generation?.prompt && <p className="truncate text-xs text-fg-subtle">{item.generation.prompt}</p>}
                  </div>
                  {lb.items.length > 1 && (
                    <span className="font-mono text-2xs text-fg-subtle">
                      {lb.index + 1}/{lb.items.length}
                    </span>
                  )}
                  {canCompare && (
                    <button type="button" onClick={() => setCompare((c) => !c)} aria-pressed={compare} className={cn("flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg", compare && "bg-surface-2 text-fg")}>
                      <Columns2 className="size-4" strokeWidth={1.75} />
                      Comparar
                    </button>
                  )}
                  {item.generation && (
                    <Link href={`/g/${item.generation.id}`} onClick={close} className="grid size-8 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label="Abrir detalhe">
                      <ExternalLink className="size-4" strokeWidth={1.75} />
                    </Link>
                  )}
                  <a href={`/api/assets/${item.asset.id}/download`} className="grid size-8 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label="Baixar">
                    <Download className="size-4" strokeWidth={1.75} />
                  </a>
                  <D.Close aria-label="Fechar" className="grid size-8 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg">
                    <X className="size-4" strokeWidth={1.75} />
                  </D.Close>
                </div>
                <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-16">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={item.asset.id} initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex max-h-full max-w-full items-center justify-center">
                      {compare && canCompare ? (
                        <Compare before={item.before!.url} after={item.asset.url} />
                      ) : item.asset.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.asset.url} alt={item.generation?.prompt ?? ""} className="max-h-[calc(100dvh-140px)] max-w-full rounded-lg object-contain" />
                      ) : item.asset.kind === "video" ? (
                        <VideoPlayer src={item.asset.url} autoPlay className="max-h-[calc(100dvh-140px)] w-[min(100%,1200px)] rounded-lg" />
                      ) : (
                        <audio src={item.asset.url} controls autoPlay className="w-[min(100%,480px)]" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                  {lb.items.length > 1 && (
                    <>
                      <button type="button" aria-label="Anterior" onClick={() => step(-1)} className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface-1 text-fg-muted hover:text-fg sm:left-4">
                        <ChevronLeft className="size-4" strokeWidth={1.75} />
                      </button>
                      <button type="button" aria-label="Próxima" onClick={() => step(1)} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface-1 text-fg-muted hover:text-fg sm:right-4">
                        <ChevronRight className="size-4" strokeWidth={1.75} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </D.Content>
          </D.Portal>
        )}
      </AnimatePresence>
    </D.Root>
  );
}
