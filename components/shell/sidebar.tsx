"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Images, LayoutGrid, MoreHorizontal, PanelLeftClose, Pencil, Plus, Search, Settings, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { cn, formatCredits } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { useConversations } from "@/lib/client/queries";
import { useUI } from "@/lib/client/ui-store";
import { IconButton } from "@/components/ui/icon-button";
import { Kbd } from "@/components/ui/kbd";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import type { ConversationDTO } from "@/lib/types";

const NAV = [
  { href: "/biblioteca", label: "Biblioteca", icon: Images },
  { href: "/personagens", label: "Personagens", icon: UserRound },
  { href: "/presets", label: "Presets", icon: LayoutGrid },
  { href: "/config", label: "Configurações", icon: Settings },
];

function groupByDate(list: ConversationDTO[]) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const groups: { label: string; items: ConversationDTO[] }[] = [
    { label: "Hoje", items: [] },
    { label: "Ontem", items: [] },
    { label: "Últimos 7 dias", items: [] },
    { label: "Últimos 30 dias", items: [] },
    { label: "Mais antigas", items: [] },
  ];
  for (const c of list) {
    const t = Date.parse(c.updatedAt);
    const i = t >= startToday ? 0 : t >= startToday - 86400_000 ? 1 : t >= startToday - 7 * 86400_000 ? 2 : t >= startToday - 30 * 86400_000 ? 3 : 4;
    groups[i].items.push(c);
  }
  return groups.filter((g) => g.items.length);
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const toggle = useUI((s) => s.toggleSidebar);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);
  const { data, isLoading, isError } = useConversations(debounced || undefined);
  const groups = useMemo(() => groupByDate(data ?? []), [data]);
  const spend = useQuery({ queryKey: ["spend"], queryFn: () => api<{ credits30d: number; generations30d: number; noCredits: boolean }>("/api/spend"), staleTime: 60_000 });
  const [renaming, setRenaming] = useState<string | null>(null);

  async function rename(id: string, title: string) {
    setRenaming(null);
    if (!title.trim()) return;
    await api(`/api/conversations/${id}`, { method: "PATCH", json: { title } }).catch(() => toast.error("Não foi possível renomear."));
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }
  async function remove(id: string) {
    await api(`/api/conversations/${id}`, { method: "DELETE" }).catch(() => toast.error("Não foi possível excluir."));
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["library"] });
    if (params.id === id) router.push("/");
  }

  return (
    <nav aria-label="Navegação principal" className="flex h-full w-[260px] flex-col bg-surface-1">
      <div className="flex h-12 items-center justify-between gap-2 px-3">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm font-medium tracking-tight">
          <span aria-hidden className="grid size-6 place-items-center rounded-md border border-border-strong bg-bg">
            <span className="size-2.5 rounded-[2px] border-[1.5px] border-accent" />
          </span>
          Studio
        </Link>
        <IconButton label="Recolher barra lateral" shortcut="Ctrl B" icon={<PanelLeftClose strokeWidth={1.75} />} size="icon-sm" onClick={onNavigate ?? toggle} className="hidden lg:inline-flex" />
        {onNavigate && <IconButton label="Fechar menu" icon={<X strokeWidth={1.75} />} size="icon-sm" onClick={onNavigate} className="lg:hidden" />}
      </div>

      <div className="flex flex-col gap-1 px-2">
        <Link
          href="/"
          onClick={() => {
            onNavigate?.();
            window.dispatchEvent(new Event("studio:new"));
          }}
          className="flex h-8 items-center gap-2 rounded-md px-2 text-sm text-fg hover:bg-surface-2"
        >
          <Plus className="size-4 text-fg-muted" strokeWidth={1.75} />
          Nova
          <span className="ml-auto hidden lg:inline-flex">
            <Kbd>Ctrl ⇧ O</Kbd>
          </span>
        </Link>
        <label className="flex h-8 items-center gap-2 rounded-md px-2 text-sm text-fg-muted focus-within:bg-surface-2">
          <Search className="size-4 shrink-0" strokeWidth={1.75} />
          <span className="sr-only">Buscar conversas</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar" className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-fg-subtle" />
        </label>
      </div>

      <div className="mt-3 flex flex-col gap-px px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn("flex h-8 items-center gap-2 rounded-md px-2 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg", active && "bg-surface-2 text-fg")}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {isLoading && (
          <div className="flex flex-col gap-1.5 px-2 pt-2" aria-hidden>
            {[70, 55, 80, 45, 60].map((w, i) => (
              <div key={i} className="shimmer h-3.5 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}
        {isError && <p className="px-2 text-xs text-fg-subtle">Não foi possível carregar as conversas.</p>}
        {!isLoading && !isError && groups.length === 0 && <p className="px-2 text-xs text-fg-subtle">{debounced ? "Nada encontrado." : "Suas conversas aparecem aqui."}</p>}
        {groups.map((g) => (
          <section key={g.label} className="mb-3">
            <h3 className="px-2 pb-1 text-2xs text-fg-subtle">{g.label}</h3>
            <ul className="flex flex-col gap-px">
              <AnimatePresence initial={false}>
                {g.items.map((c) => {
                  const active = params.id === c.id;
                  return (
                    <motion.li key={c.id} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group relative">
                      {renaming === c.id ? (
                        <input
                          autoFocus
                          defaultValue={c.title}
                          aria-label="Novo título"
                          onBlur={(e) => rename(c.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") rename(c.id, e.currentTarget.value);
                            if (e.key === "Escape") setRenaming(null);
                          }}
                          className="h-8 w-full rounded-md border border-accent bg-bg px-2 text-sm outline-none"
                        />
                      ) : (
                        <Link
                          href={`/c/${c.id}`}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          className={cn("flex h-8 items-center rounded-md pl-2 pr-8 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg", active && "bg-surface-2 text-fg")}
                        >
                          <span className="truncate">{c.title}</span>
                        </Link>
                      )}
                      {renaming !== c.id && (
                        <Menu>
                          <MenuTrigger
                            aria-label={`Opções de ${c.title}`}
                            className="absolute right-1 top-1 grid size-6 place-items-center rounded-md text-fg-subtle opacity-0 hover:bg-surface-3 hover:text-fg focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                          >
                            <MoreHorizontal className="size-4" strokeWidth={1.75} />
                          </MenuTrigger>
                          <MenuContent align="start">
                            <MenuItem icon={<Pencil strokeWidth={1.75} />} onSelect={() => setRenaming(c.id)}>
                              Renomear
                            </MenuItem>
                            <MenuItem icon={<Trash2 strokeWidth={1.75} />} danger onSelect={() => remove(c.id)}>
                              Excluir
                            </MenuItem>
                          </MenuContent>
                        </Menu>
                      )}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </section>
        ))}
      </div>

      <div className="border-t border-border px-3 py-2.5">
        <Link href="/config" onClick={onNavigate} className="flex items-center justify-between gap-2 rounded-md px-1 py-1 text-xs text-fg-subtle hover:text-fg">
          <span>{spend.data?.noCredits ? <span className="text-danger">Sem créditos na API</span> : "Gasto em 30 dias"}</span>
          <span className="font-mono tabular text-fg-muted">{spend.data ? `${formatCredits(spend.data.credits30d)} cr` : "..."}</span>
        </Link>
      </div>
    </nav>
  );
}
