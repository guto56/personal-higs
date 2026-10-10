"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { create } from "zustand";
import { TERMINAL, type ConversationDTO, type GenerationDTO } from "@/lib/types";
import { api } from "./api";

export const qk = {
  conversations: (q?: string) => ["conversations", q ?? ""] as const,
  conversation: (id: string) => ["conversation", id] as const,
  generation: (id: string) => ["generation", id] as const,
  library: (f: Record<string, string>) => ["library", f] as const,
  characters: ["characters"] as const,
  health: ["health"] as const,
  settings: ["settings"] as const,
};

export function useConversations(q?: string) {
  return useQuery({
    queryKey: qk.conversations(q),
    queryFn: () => api<{ conversations: ConversationDTO[] }>(`/api/conversations${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((r) => r.conversations),
    staleTime: 30_000,
  });
}

export type ConversationData = { conversation: ConversationDTO; generations: GenerationDTO[] };

export function useConversation(id: string | null) {
  const query = useQuery({
    queryKey: qk.conversation(id ?? "none"),
    queryFn: () => api<ConversationData>(`/api/conversations/${id}`),
    enabled: !!id,
  });
  const track = useActive((s) => s.track);
  useEffect(() => {
    for (const g of query.data?.generations ?? []) if (!TERMINAL.includes(g.status)) track(g);
  }, [query.data, track]);
  return query;
}

/** Atualiza uma geração em todos os caches onde ela aparece. */
export function upsertGeneration(qc: QueryClient, g: GenerationDTO) {
  qc.setQueryData<ConversationData>(qk.conversation(g.conversationId), (old) => {
    if (!old) return old;
    const exists = old.generations.some((x) => x.id === g.id);
    return { ...old, generations: exists ? old.generations.map((x) => (x.id === g.id ? g : x)) : [...old.generations, g] };
  });
  qc.setQueryData(qk.generation(g.id), (old: { generation: GenerationDTO } | undefined) => (old ? { ...old, generation: g } : old));
}

/** Gerações em andamento (em qualquer conversa) acompanhadas pelo poller global. */
interface ActiveState {
  active: Record<string, { since: number }>;
  track: (g: GenerationDTO) => void;
  untrack: (id: string) => void;
}
export const useActive = create<ActiveState>((set) => ({
  active: {},
  track: (g) => set((s) => (s.active[g.id] ? s : { active: { ...s.active, [g.id]: { since: Date.parse(g.createdAt) || Date.now() } } })),
  untrack: (id) =>
    set((s) => {
      const next = { ...s.active };
      delete next[id];
      return { active: next };
    }),
}));

/** Polling com backoff: 2s nos primeiros 30s, depois até 6s. Uma requisição em lote para todas. */
export function useGenerationPoller() {
  const qc = useQueryClient();
  const active = useActive((s) => s.active);
  const untrack = useActive((s) => s.untrack);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ids = Object.keys(active);
    if (ids.length === 0) return;
    let cancelled = false;
    const oldest = Math.min(...ids.map((id) => active[id].since));
    const age = Date.now() - oldest;
    const delay = age < 30_000 ? 2000 : age < 120_000 ? 4000 : 6000;
    timer.current = setTimeout(async () => {
      if (document.visibilityState === "hidden" && age > 30_000) {
        // Em segundo plano, espaça mais.
        await new Promise((r) => setTimeout(r, 6000));
      }
      try {
        const { generations } = await api<{ generations: GenerationDTO[] }>("/api/generations/poll", { method: "POST", json: { ids: ids.slice(0, 30) } });
        if (cancelled) return;
        let finished = false;
        for (const g of generations) {
          upsertGeneration(qc, g);
          if (TERMINAL.includes(g.status)) {
            untrack(g.id);
            finished = true;
          }
        }
        if (finished) {
          qc.invalidateQueries({ queryKey: ["library"] });
          qc.invalidateQueries({ queryKey: ["spend"] });
        }
        // Força o próximo ciclo mesmo sem mudança de ids.
        useActive.setState((s) => ({ active: { ...s.active } }));
      } catch {
        if (!cancelled) useActive.setState((s) => ({ active: { ...s.active } }));
      }
    }, delay);
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [active, qc, untrack]);
}

export function useCreateGeneration() {
  const qc = useQueryClient();
  const track = useActive((s) => s.track);
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api<{ generation: GenerationDTO }>("/api/generations", { method: "POST", json: body }).then((r) => r.generation),
    onSuccess: (g) => {
      const has = qc.getQueryData(qk.conversation(g.conversationId));
      if (has) upsertGeneration(qc, g);
      else qc.invalidateQueries({ queryKey: qk.conversation(g.conversationId) });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      if (!TERMINAL.includes(g.status)) track(g);
    },
  });
}
