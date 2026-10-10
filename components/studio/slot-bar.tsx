"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { AlertCircle, AudioLines, FolderOpen, Plus, Upload, X } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import type { ModelDef, SlotDef } from "@/lib/catalog";
import { useComposer, type Attachment } from "@/lib/client/composer-store";
import { acceptFor, attachExisting, uploadToSlot } from "@/lib/client/upload";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { Tooltip } from "@/components/ui/tooltip";
import { LibraryPicker } from "./library-picker";

function Thumb({ a }: { a: Attachment }) {
  const remove = useComposer((s) => s.removeAttachment);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
      className={cn("group relative size-14 shrink-0 overflow-hidden rounded-md border bg-surface-2", a.status === "error" ? "border-danger" : "border-border")}
    >
      {a.kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.previewUrl} alt={a.fileName} className="size-full object-cover" />
      )}
      {a.kind === "video" && <video src={`${a.previewUrl}#t=0.1`} muted playsInline preload="metadata" className="size-full object-cover" />}
      {a.kind === "audio" && (
        <div className="grid size-full place-items-center text-fg-muted">
          <AudioLines className="size-5" strokeWidth={1.5} />
        </div>
      )}
      {a.duration ? <span className="absolute bottom-0.5 left-0.5 rounded-sm bg-black/60 px-1 font-mono text-[10px] leading-4 text-white">{formatDuration(a.duration)}</span> : null}
      {a.status === "uploading" && (
        <div className="absolute inset-0 flex items-end bg-black/35">
          <div className="h-[3px] w-full bg-white/20">
            <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${Math.max(4, a.progress * 100)}%` }} />
          </div>
        </div>
      )}
      {a.status === "error" && (
        <Tooltip content={a.error ?? "Erro"}>
          <div className="absolute inset-0 grid place-items-center bg-danger/25 text-white" role="alert" aria-label={a.error}>
            <AlertCircle className="size-5" strokeWidth={1.75} />
          </div>
        </Tooltip>
      )}
      <button
        type="button"
        aria-label={`Remover ${a.fileName}`}
        onClick={() => remove(a.localId)}
        className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-black/65 text-white opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <X className="size-3" strokeWidth={2} />
      </button>
    </motion.div>
  );
}

function Slot({ slot, items }: { slot: SlotDef; items: Attachment[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [libOpen, setLibOpen] = useState(false);
  const full = items.length >= slot.max;
  const error = items.find((i) => i.status === "error")?.error;

  const addFiles = (files: FileList | File[]) => {
    const room = slot.max - items.length;
    Array.from(files)
      .slice(0, Math.max(0, room))
      .forEach((f) => uploadToSlot(f, slot));
  };

  return (
    <div
      className={cn("flex min-w-0 flex-col gap-1.5 rounded-lg p-1.5 transition-colors", over && "bg-accent-soft")}
      onDragOver={(e) => {
        if (full) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex items-center gap-1.5 text-2xs">
        <span className="text-fg-muted">{slot.label}</span>
        {slot.required ? <span className="text-accent">obrigatório</span> : <span className="text-fg-subtle">opcional</span>}
        {slot.multiple && (
          <span className="font-mono text-fg-subtle">
            {items.length}/{slot.max}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <AnimatePresence initial={false}>
          {items.map((a) => (
            <Thumb key={a.localId} a={a} />
          ))}
        </AnimatePresence>
        {!full && (
          <Menu>
            <MenuTrigger
              aria-label={`Adicionar ${slot.label}`}
              className="grid size-14 shrink-0 place-items-center rounded-md border border-dashed border-border-strong text-fg-subtle transition-colors hover:border-fg-subtle hover:text-fg data-[state=open]:border-fg-subtle data-[state=open]:text-fg"
            >
              <Plus className="size-4" strokeWidth={1.75} />
            </MenuTrigger>
            <MenuContent align="start" side="top">
              <MenuItem icon={<Upload strokeWidth={1.75} />} onSelect={() => input.current?.click()}>
                Escolher arquivo
              </MenuItem>
              <MenuItem icon={<FolderOpen strokeWidth={1.75} />} onSelect={() => setLibOpen(true)}>
                Da Biblioteca
              </MenuItem>
            </MenuContent>
          </Menu>
        )}
        <input ref={input} type="file" hidden accept={acceptFor(slot.kind)} multiple={slot.multiple} onChange={(e) => (e.target.files && addFiles(e.target.files), (e.target.value = ""))} />
      </div>
      {(error || slot.hint) && <p className={cn("max-w-72 text-2xs", error ? "text-danger" : "text-fg-subtle")}>{error ?? slot.hint}</p>}
      <LibraryPicker open={libOpen} onOpenChange={setLibOpen} kind={slot.kind} onPick={(a) => attachExisting(a, slot.field)} />
    </div>
  );
}

export function SlotBar({ model }: { model: ModelDef }) {
  const attachments = useComposer((s) => s.attachments);
  if (model.slots.length === 0) return null;
  return (
    <div className="-mx-1.5 flex flex-wrap gap-x-3 gap-y-1">
      {model.slots.map((slot) => (
        <Slot key={slot.field} slot={slot} items={attachments.filter((a) => a.field === slot.field)} />
      ))}
    </div>
  );
}

/** Coloca arquivos soltos/colados no primeiro slot compatível com espaço. */
export function routeFiles(model: ModelDef, files: File[]) {
  const atts = useComposer.getState().attachments;
  for (const f of files) {
    const kind = f.type.split("/")[0];
    const slot = model.slots.find((s) => s.kind === kind && atts.filter((a) => a.field === s.field).length < s.max);
    if (slot) uploadToSlot(f, slot);
  }
  return files.some((f) => model.slots.some((s) => s.kind === f.type.split("/")[0]));
}
