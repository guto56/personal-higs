"use client";

import { Command } from "cmdk";
import * as D from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Clapperboard, Film, Image as ImageIcon, Images, LayoutGrid, MessageSquare, Moon, Plus, Settings, Sparkles, Sun, UserRound, Wand2 } from "lucide-react";
import { MODES, MODELS, type Mode } from "@/lib/catalog";
import { useComposer } from "@/lib/client/composer-store";
import { useConversations } from "@/lib/client/queries";
import { getThemePref, setTheme, useUI } from "@/lib/client/ui-store";
import { formatCredits } from "@/lib/utils";

const MODE_ICON: Record<Mode, typeof ImageIcon> = { image: ImageIcon, video: Film, audio: Sparkles, edit: Wand2, apps: Clapperboard };

function Item({ children, onSelect, value, icon, hint }: { children: React.ReactNode; onSelect: () => void; value: string; icon?: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex h-9 cursor-default select-none items-center gap-2.5 rounded-md px-2.5 text-sm text-fg data-[selected=true]:bg-surface-2 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-muted"
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint && <span className="shrink-0 font-mono text-2xs text-fg-subtle">{hint}</span>}
    </Command.Item>
  );
}

function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group heading={heading} className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:text-fg-subtle">
      {children}
    </Command.Group>
  );
}

export function CommandPalette() {
  const open = useUI((s) => s.paletteOpen);
  const setOpen = useUI((s) => s.setPalette);
  const router = useRouter();
  const load = useComposer((s) => s.load);
  const { data: conversations } = useConversations();

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };
  const goStudio = (mode: Mode, subtype: string, modelId?: string) =>
    run(() => {
      load({ mode, subtype, modelId });
      if (!location.pathname.startsWith("/c/") && location.pathname !== "/") router.push("/");
    });

  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <D.Portal forceMount>
            <D.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </D.Overlay>
            <D.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className="fixed left-1/2 top-[14vh] z-50 w-[calc(100vw-24px)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border-strong bg-surface-1 shadow-[var(--shadow-pop)]"
              >
                <D.Title className="sr-only">Comandos</D.Title>
                <D.Description className="sr-only">Troque de modo, modelo, conversa ou página.</D.Description>
                <Command loop label="Comandos">
                  <Command.Input autoFocus placeholder="Buscar modo, modelo, conversa ou página" className="h-12 w-full border-b border-border bg-transparent px-4 text-base outline-none placeholder:text-fg-subtle" />
                  <Command.List className="max-h-[min(60vh,440px)] overflow-y-auto p-1.5">
                    <Command.Empty className="px-3 py-6 text-center text-sm text-fg-subtle">Nada encontrado.</Command.Empty>
                    <Group heading="Ações">
                      <Item value="nova conversa" icon={<Plus strokeWidth={1.75} />} hint="Ctrl ⇧ O" onSelect={() => run(() => (router.push("/"), window.dispatchEvent(new Event("studio:new"))))}>
                        Nova conversa
                      </Item>
                      <Item value="alternar tema claro escuro" icon={getThemePref() === "light" ? <Moon strokeWidth={1.75} /> : <Sun strokeWidth={1.75} />} onSelect={() => run(() => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"))}>
                        Alternar tema
                      </Item>
                    </Group>
                    <Group heading="Modos">
                      {MODES.flatMap((m) =>
                        m.subtypes.map((s) => {
                          const Icon = MODE_ICON[m.id];
                          return (
                            <Item key={`${m.id}/${s.id}`} value={`modo ${m.label} ${s.label}`} icon={<Icon strokeWidth={1.75} />} onSelect={() => goStudio(m.id, s.id)}>
                              {m.label} <span className="text-fg-subtle">/ {s.label}</span>
                            </Item>
                          );
                        }),
                      )}
                    </Group>
                    <Group heading="Modelos">
                      {MODELS.flatMap((model) =>
                        model.uses.map((u) => {
                          const mode = MODES.find((m) => m.id === u.mode);
                          const sub = mode?.subtypes.find((s) => s.id === u.subtype);
                          if (!mode || !sub) return null;
                          return (
                            <Item
                              key={`${model.id}|${u.mode}/${u.subtype}`}
                              value={`modelo ${model.name} ${model.id} ${mode.label} ${sub.label}`}
                              icon={<Sparkles strokeWidth={1.75} />}
                              hint={model.estimate?.type === "credits" ? `${formatCredits(model.estimate.credits)} cr` : undefined}
                              onSelect={() => goStudio(u.mode, u.subtype, model.id)}
                            >
                              {model.name} <span className="text-fg-subtle">/ {mode.label} {sub.label.toLowerCase()}</span>
                            </Item>
                          );
                        }),
                      )}
                    </Group>
                    {conversations && conversations.length > 0 && (
                      <Group heading="Conversas">
                        {conversations.slice(0, 30).map((c) => (
                          <Item key={c.id} value={`conversa ${c.title} ${c.id}`} icon={<MessageSquare strokeWidth={1.75} />} onSelect={() => run(() => router.push(`/c/${c.id}`))}>
                            {c.title}
                          </Item>
                        ))}
                      </Group>
                    )}
                    <Group heading="Páginas">
                      <Item value="pagina biblioteca" icon={<Images strokeWidth={1.75} />} onSelect={() => run(() => router.push("/biblioteca"))}>
                        Biblioteca
                      </Item>
                      <Item value="pagina personagens" icon={<UserRound strokeWidth={1.75} />} onSelect={() => run(() => router.push("/personagens"))}>
                        Personagens
                      </Item>
                      <Item value="pagina presets apps" icon={<LayoutGrid strokeWidth={1.75} />} onSelect={() => run(() => router.push("/presets"))}>
                        Presets
                      </Item>
                      <Item value="pagina configuracoes" icon={<Settings strokeWidth={1.75} />} onSelect={() => run(() => router.push("/config"))}>
                        Configurações
                      </Item>
                    </Group>
                  </Command.List>
                </Command>
              </motion.div>
            </D.Content>
          </D.Portal>
        )}
      </AnimatePresence>
    </D.Root>
  );
}
