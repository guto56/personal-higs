"use client";

import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { cn, formatCredits } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { getModel, MODELS } from "@/lib/catalog";
import { useComposer } from "@/lib/client/composer-store";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "./page-header";

type Character = { id: string; referenceId: string | null; name: string; version: string; status: string; error: string | null; images: number; thumbnail: string | null; createdAt: string };

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: { label: "Pronto", cls: "text-success" },
  failed: { label: "Falhou", cls: "text-danger" },
  queued: { label: "Na fila", cls: "text-fg-muted" },
  not_ready: { label: "Preparando", cls: "text-fg-muted" },
  in_progress: { label: "Treinando", cls: "text-accent" },
};

const VERSIONS = [
  { id: "v2", label: "SOUL V2", model: "higgsfield-ai/soul/v2/standard" },
  { id: "v1", label: "SOUL", model: "higgsfield-ai/soul/standard" },
].filter((v) => getModel(v.model));

// Custo do treinamento informado pelo catálogo (GET /models -> soul-id).
const TRAIN_CREDITS = 40;

type Upload = { localId: string; file: File; preview: string; status: "uploading" | "ready" | "error"; assetId?: string; error?: string };

function NewCharacter({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [version, setVersion] = useState(VERSIONS[0]?.id ?? "v2");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function add(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const u: Upload = { localId: crypto.randomUUID(), file, preview: URL.createObjectURL(file), status: "uploading" };
      setUploads((l) => [...l, u]);
      try {
        const { assetId, uploadUrl } = await api<{ assetId: string; uploadUrl: string }>("/api/uploads", { method: "POST", json: { fileName: file.name, mime: file.type, size: file.size, kind: "image" } });
        const r = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": file.type, "x-upsert": "true" }, body: file });
        if (!r.ok) throw new Error("Falha no envio.");
        await api(`/api/uploads/${assetId}/complete`, { method: "POST" });
        setUploads((l) => l.map((x) => (x.localId === u.localId ? { ...x, status: "ready", assetId } : x)));
      } catch (e) {
        setUploads((l) => l.map((x) => (x.localId === u.localId ? { ...x, status: "error", error: (e as Error).message } : x)));
      }
    }
  }

  const ready = uploads.filter((u) => u.status === "ready");
  const busy = uploads.some((u) => u.status === "uploading");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || ready.length === 0 || busy) return;
    setPending(true);
    try {
      await api("/api/characters", { method: "POST", json: { name: name.trim(), version, assetIds: ready.map((u) => u.assetId) } });
      toast.success("Treinamento iniciado.");
      qc.invalidateQueries({ queryKey: ["characters"] });
      setName("");
      setUploads([]);
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Novo personagem" description="Envie fotos da mesma pessoa (rosto visível, ângulos e luzes variados). Quanto mais, melhor." className="max-w-xl">
      <form onSubmit={submit} className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="char-name" className="text-sm text-fg-muted">
            Nome
          </label>
          <input id="char-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required className="h-9 rounded-md border border-border-strong bg-bg px-3 text-sm outline-none focus-visible:border-accent" />
        </div>
        {VERSIONS.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-fg-muted">Para usar com</span>
            <div role="radiogroup" className="flex gap-1.5">
              {VERSIONS.map((v) => (
                <button key={v.id} type="button" role="radio" aria-checked={version === v.id} onClick={() => setVersion(v.id)} className={cn("h-8 rounded-md border px-3 text-sm", version === v.id ? "border-accent/60 bg-accent-soft text-fg" : "border-border text-fg-muted hover:text-fg")}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div
          className="flex flex-col gap-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            add(e.dataTransfer.files);
          }}
        >
          <span className="text-sm text-fg-muted">
            Fotos <span className="font-mono text-2xs text-fg-subtle">{ready.length}/100</span>
          </span>
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
            <AnimatePresence initial={false}>
              {uploads.map((u) => (
                <motion.div key={u.localId} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={cn("group relative aspect-square overflow-hidden rounded-md border", u.status === "error" ? "border-danger" : "border-border")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.preview} alt="" className="size-full object-cover" />
                  {u.status === "uploading" && (
                    <div className="absolute inset-0 grid place-items-center bg-black/40">
                      <Loader2 className="size-4 animate-spin text-white" />
                    </div>
                  )}
                  <button type="button" aria-label="Remover" onClick={() => setUploads((l) => l.filter((x) => x.localId !== u.localId))} className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100">
                    <X className="size-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            <button type="button" onClick={() => input.current?.click()} className="grid aspect-square place-items-center rounded-md border border-dashed border-border-strong text-fg-subtle hover:text-fg" aria-label="Adicionar fotos">
              <ImagePlus className="size-5" strokeWidth={1.5} />
            </button>
          </div>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => (e.target.files && add(e.target.files), (e.target.value = ""))} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="font-mono text-2xs text-fg-subtle">Treino: {formatCredits(TRAIN_CREDITS)} cr</span>
          <Button type="submit" variant="primary" disabled={!name.trim() || ready.length === 0 || busy || pending}>
            {pending && <Loader2 className="animate-spin" />}
            Treinar personagem
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function Characters() {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const load = useComposer((s) => s.load);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["characters"],
    queryFn: () => api<{ characters: Character[] }>("/api/characters").then((r) => r.characters),
    refetchInterval: (q) => (q.state.data?.some((c) => !["completed", "failed"].includes(c.status)) ? 8000 : false),
  });
  const hasSoul = MODELS.some((m) => m.uses.some((u) => u.subtype === "character"));

  function use(c: Character) {
    const v = VERSIONS.find((x) => x.id === c.version) ?? VERSIONS[0];
    if (!v || !c.referenceId) return;
    load({ mode: "image", subtype: "character", modelId: v.model, params: { ...useComposer.getState().paramsByModel[v.model], custom_reference_id: c.referenceId } });
    router.push("/");
  }

  async function remove(c: Character) {
    await api(`/api/characters/${c.id}`, { method: "DELETE" }).catch((e) => toast.error((e as Error).message));
    qc.invalidateQueries({ queryKey: ["characters"] });
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PageHeader title="Personagens" description="Personagens treinados com Soul ID para manter o mesmo rosto entre gerações.">
        {hasSoul && (
          <Button variant="primary" size="md" onClick={() => setOpen(true)}>
            <Plus strokeWidth={2} /> Novo personagem
          </Button>
        )}
      </PageHeader>
      <div className="px-4 pb-10 pt-2 sm:px-6">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shimmer aspect-[4/5] rounded-xl" />
            ))}
          </div>
        )}
        {isError && <p className="py-16 text-sm text-fg-muted">{(error as Error).message}</p>}
        {data && data.length === 0 && (
          <div className="flex max-w-md flex-col gap-2 py-16">
            <p className="text-sm text-fg">Nenhum personagem ainda.</p>
            <p className="text-sm text-fg-muted">Treine um com 5 a 20 fotos da mesma pessoa. Depois, escolha o personagem no chip &quot;Personagem&quot; do Studio em Imagem.</p>
            {hasSoul && (
              <Button variant="secondary" size="sm" className="mt-2 w-fit" onClick={() => setOpen(true)}>
                <Plus strokeWidth={2} /> Novo personagem
              </Button>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data?.map((c) => {
            const st = STATUS[c.status] ?? { label: c.status, cls: "text-fg-muted" };
            return (
              <div key={c.id} className="group flex flex-col gap-2">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-surface-1">
                  {c.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail} alt="" loading="lazy" className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center text-fg-subtle">
                      <UserRound className="size-8" strokeWidth={1.25} />
                    </div>
                  )}
                  {c.status !== "completed" && <div className="absolute inset-0 bg-bg/40" />}
                  <button type="button" aria-label={`Excluir ${c.name}`} onClick={() => remove(c)} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-md bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100">
                    <Trash2 className="size-3.5" strokeWidth={1.75} />
                  </button>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-fg">{c.name}</p>
                    <p className="text-2xs">
                      <span className={st.cls}>{st.label}</span>
                      <span className="text-fg-subtle"> · {c.images} fotos</span>
                    </p>
                    {c.error && <p className="text-2xs text-danger">{c.error}</p>}
                  </div>
                  {c.status === "completed" && (
                    <Button size="sm" variant="secondary" onClick={() => use(c)}>
                      Usar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <NewCharacter open={open} onOpenChange={setOpen} />
    </div>
  );
}
