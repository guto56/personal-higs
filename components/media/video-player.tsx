"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";

/** Player limpo: play/pause, tempo em mono, barra de progresso arrastável, mudo e tela cheia. */
export function VideoPlayer({ src, poster, autoPlay, className, loop = true }: { src: string; poster?: string; autoPlay?: boolean; className?: string; loop?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (autoPlay) v.play().catch(() => {});
  }, [autoPlay, src]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };
  const seek = (clientX: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    if (ref.current && dur) ref.current.currentTime = p * dur;
  };

  return (
    <div ref={wrap} className={cn("group/player relative overflow-hidden bg-black", className)} onKeyDown={(e) => e.key === " " && (e.preventDefault(), toggle())}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted={muted}
        loop={loop}
        playsInline
        preload="metadata"
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => !scrubbing && setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        className="block size-full object-contain"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-8 opacity-0 transition-opacity duration-150 group-hover/player:opacity-100 group-focus-within/player:opacity-100 [@media(hover:none)]:opacity-100">
        <div
          role="slider"
          tabIndex={0}
          aria-label="Posição do vídeo"
          aria-valuemin={0}
          aria-valuemax={Math.round(dur)}
          aria-valuenow={Math.round(time)}
          className="pointer-events-auto relative h-3 cursor-pointer"
          onPointerDown={(e) => {
            setScrubbing(true);
            e.currentTarget.setPointerCapture(e.pointerId);
            seek(e.clientX, e.currentTarget);
          }}
          onPointerMove={(e) => scrubbing && seek(e.clientX, e.currentTarget)}
          onPointerUp={() => setScrubbing(false)}
          onKeyDown={(e) => {
            if (!ref.current) return;
            if (e.key === "ArrowRight") ref.current.currentTime += 2;
            if (e.key === "ArrowLeft") ref.current.currentTime -= 2;
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/25" />
          <div className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white" style={{ width: dur ? `${(time / dur) * 100}%` : 0 }} />
        </div>
        <div className="pointer-events-auto flex items-center gap-1 text-white">
          <button type="button" aria-label={playing ? "Pausar" : "Reproduzir"} onClick={toggle} className="grid size-7 place-items-center rounded-md hover:bg-white/15">
            {playing ? <Pause className="size-4" strokeWidth={1.75} /> : <Play className="size-4" strokeWidth={1.75} />}
          </button>
          <span className="font-mono text-2xs tabular text-white/80">
            {formatDuration(time)} / {formatDuration(dur)}
          </span>
          <span className="flex-1" />
          <button type="button" aria-label={muted ? "Ativar som" : "Silenciar"} onClick={() => setMuted((m) => !m)} className="grid size-7 place-items-center rounded-md hover:bg-white/15">
            {muted ? <VolumeX className="size-4" strokeWidth={1.75} /> : <Volume2 className="size-4" strokeWidth={1.75} />}
          </button>
          <button type="button" aria-label="Tela cheia" onClick={() => wrap.current?.requestFullscreen?.()} className="grid size-7 place-items-center rounded-md hover:bg-white/15">
            <Maximize className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
      {!playing && (
        <button type="button" aria-label="Reproduzir" onClick={toggle} className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-transform duration-150 hover:scale-105">
          <Play className="size-5 translate-x-px" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
