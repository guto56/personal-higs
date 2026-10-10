"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AudioLines, Play } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import type { AssetDTO } from "@/lib/types";

/**
 * Miniatura com lazy load. Vídeos carregam só os metadados e tocam apenas no hover
 * enquanto visíveis (sem jank com dezenas de vídeos). Revelação de blur para nítido.
 */
export function MediaThumb({ asset, className, style, fit = "cover", reveal = false, rounded = true }: { asset: Pick<AssetDTO, "kind" | "url" | "duration">; className?: string; style?: React.CSSProperties; fit?: "cover" | "contain"; reveal?: boolean; rounded?: boolean }) {
  const [loaded, setLoaded] = useState(asset.kind === "audio");
  const [visible, setVisible] = useState(false);
  const [dur, setDur] = useState<number | null>(asset.duration);
  const ref = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) video.current?.pause();
  }, [visible]);


  const animate = reveal && !reduce;
  return (
    <div ref={ref} style={style} className={cn("relative overflow-hidden bg-surface-2", rounded && "rounded-lg", className)}>
      {!loaded && <div className="shimmer absolute inset-0" aria-hidden />}
      {asset.kind === "image" && (
        <motion.img
          src={asset.url}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          initial={animate ? { filter: "blur(14px)", opacity: 0.5, scale: 1.02 } : false}
          animate={loaded ? { filter: "blur(0px)", opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className={cn("size-full", fit === "cover" ? "object-cover" : "object-contain")}
        />
      )}
      {asset.kind === "video" && (
        <>
          {visible && (
            <motion.video
              ref={video}
              src={`${asset.url}#t=0.1`}
              muted
              loop
              playsInline
              preload="metadata"
              onLoadedData={() => setLoaded(true)}
              onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
              onPointerEnter={(e) => e.currentTarget.play().catch(() => {})}
              onPointerLeave={(e) => {
                e.currentTarget.pause();
              }}
              initial={animate ? { filter: "blur(14px)", opacity: 0.5 } : false}
              animate={loaded ? { filter: "blur(0px)", opacity: 1 } : undefined}
              transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
              className={cn("size-full", fit === "cover" ? "object-cover" : "object-contain")}
            />
          )}
          <span className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-sm bg-black/55 px-1.5 py-0.5 font-mono text-2xs text-white">
            <Play className="size-2.5" strokeWidth={2} />
            {dur ? formatDuration(dur) : ""}
          </span>
        </>
      )}
      {asset.kind === "audio" && (
        <div className="flex size-full flex-col items-center justify-center gap-2 p-2 text-fg-muted">
          <AudioLines className="size-6" strokeWidth={1.5} />
          {visible && <audio src={asset.url} controls preload="none" className="h-8 w-full max-w-60" />}
        </div>
      )}
    </div>
  );
}
