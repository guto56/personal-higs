"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import type { MediaKind } from "@/lib/catalog";
import type { AssetDTO } from "@/lib/types";
import { Dialog } from "@/components/ui/dialog";
import { MediaThumb } from "@/components/media/media-thumb";

type Page = { assets: AssetDTO[]; nextCursor: string | null };

export function LibraryPicker({ open, onOpenChange, kind, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; kind: MediaKind; onPick: (a: AssetDTO) => void }) {
  const [source, setSource] = useState<"generation" | "upload">("generation");
  const q = useInfiniteQuery({
    queryKey: ["library-picker", kind, source],
    enabled: open,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => api<Page>(`/api/assets?kind=${kind}&source=${source}${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`),
    getNextPageParam: (p) => p.nextCursor,
  });
  const items = q.data?.pages.flatMap((p) => p.assets) ?? [];
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Escolher da Biblioteca" className="max-w-2xl">
      <div className="flex gap-1 px-5 pt-3">
        {(["generation", "upload"] as const).map((s) => (
          <button key={s} type="button" onClick={() => setSource(s)} aria-pressed={source === s} className={cn("h-7 rounded-md px-2.5 text-xs", source === s ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg")}>
            {s === "generation" ? "Gerados" : "Enviados"}
          </button>
        ))}
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-5 pt-3">
        {q.isLoading && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shimmer aspect-square rounded-lg" />
            ))}
          </div>
        )}
        {!q.isLoading && items.length === 0 && <p className="py-10 text-center text-sm text-fg-subtle">Nada aqui ainda.</p>}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((a) => (
            <button key={a.id} type="button" onClick={() => (onPick(a), onOpenChange(false))} className="rounded-lg outline-offset-2 transition-transform duration-150 hover:scale-[0.98]" aria-label={a.fileName ?? "Mídia"}>
              <MediaThumb asset={a} className="aspect-square" />
            </button>
          ))}
        </div>
        {q.hasNextPage && (
          <button type="button" onClick={() => q.fetchNextPage()} className="mx-auto mt-4 block text-sm text-fg-muted hover:text-fg">
            {q.isFetchingNextPage ? "Carregando..." : "Carregar mais"}
          </button>
        )}
      </div>
    </Dialog>
  );
}
