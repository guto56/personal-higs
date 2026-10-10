"use client";

import { useParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useConversation } from "@/lib/client/queries";
import { Composer } from "./composer";
import { EmptyState } from "./empty-state";
import { ResultCard } from "./result-card";
import { UserMessage } from "./user-message";

function ThreadSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8 px-4 py-10 sm:px-6" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="shimmer ml-auto h-10 w-2/3 rounded-xl" />
          <div className="shimmer aspect-square w-full max-w-[360px] rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function Studio() {
  const params = useParams<{ id?: string }>();
  const id = params.id ?? null;
  const { data, isLoading, isError, error } = useConversation(id);
  const scroller = useRef<HTMLDivElement>(null);
  const count = data?.generations.length ?? 0;
  const lastCount = useRef(0);

  // Rola para o fim ao abrir a conversa e quando entra uma geração nova.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (count > lastCount.current) el.scrollTo({ top: el.scrollHeight, behavior: lastCount.current === 0 ? "auto" : "smooth" });
    lastCount.current = count;
  }, [count]);
  useEffect(() => {
    lastCount.current = 0;
  }, [id]);

  useEffect(() => {
    document.title = data?.conversation.title ? `${data.conversation.title} · Studio` : "Studio";
  }, [data?.conversation.title]);

  return (
    <div className="flex h-full flex-col">
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        {!id && <EmptyState />}
        {id && isLoading && <ThreadSkeleton />}
        {id && isError && (
          <div className="mx-auto flex max-w-[820px] flex-col items-start gap-2 px-6 py-16">
            <TriangleAlert className="size-5 text-danger" strokeWidth={1.75} />
            <p className="text-sm text-fg">{(error as Error)?.message ?? "Não foi possível abrir a conversa."}</p>
            <Link href="/" className="text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">
              Começar uma nova
            </Link>
          </div>
        )}
        {data && (
          <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8 px-4 pb-8 pt-10 sm:px-6">
            {data.generations.map((g) => (
              <section key={g.id} className="flex flex-col gap-3" aria-label="Geração">
                <UserMessage g={g} />
                <ResultCard g={g} />
              </section>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0 px-2 pb-[max(8px,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4">
        <div className="mx-auto w-full max-w-[820px]">
          <Composer conversationId={id} />
        </div>
      </div>
    </div>
  );
}
