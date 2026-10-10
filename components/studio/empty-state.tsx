"use client";

import { motion } from "motion/react";
import { Clapperboard, Film, Image as ImageIcon, Wand2 } from "lucide-react";
import { MODES, type Mode } from "@/lib/catalog";
import { useComposer } from "@/lib/client/composer-store";

const SUGGESTIONS: { mode: Mode; subtype: string; icon: typeof ImageIcon; title: string; prompt: string }[] = [
  { mode: "image", subtype: "text", icon: ImageIcon, title: "Retrato em luz de janela", prompt: "Retrato editorial de uma mulher de 30 anos ao lado de uma janela, luz natural suave, grão de filme 35mm" },
  { mode: "video", subtype: "image", icon: Film, title: "Animar uma imagem", prompt: "Câmera se aproxima devagar, cabelo balança com o vento" },
  { mode: "edit", subtype: "image", icon: Wand2, title: "Editar uma foto", prompt: "Troque o fundo por uma rua de Lisboa ao entardecer, mantendo a pessoa igual" },
  { mode: "video", subtype: "text", icon: Clapperboard, title: "Plano de drone", prompt: "Drone sobrevoando um vale com neblina ao amanhecer, movimento lento e estável" },
];

export function EmptyState() {
  const load = useComposer((s) => s.load);
  const list = SUGGESTIONS.filter((s) => MODES.some((m) => m.id === s.mode && m.subtypes.some((x) => x.id === s.subtype)));
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[820px] flex-col justify-center px-4 py-10 sm:px-6">
      <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-semibold tracking-[-0.01em] text-fg">
        O que vamos gerar?
      </motion.h1>
      <p className="mt-1 text-sm text-fg-muted">Escolha o modo abaixo, anexe arquivos se precisar e descreva o resultado.</p>
      <div className="mt-5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {list.map((s, i) => (
          <motion.button
            key={s.title}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.04 * i } }}
            onClick={() => load({ mode: s.mode, subtype: s.subtype, prompt: s.prompt })}
            className="flex items-start gap-2.5 rounded-lg border border-border px-3 py-2.5 text-left transition-colors duration-150 hover:border-border-strong hover:bg-surface-1"
          >
            <s.icon className="mt-0.5 size-4 shrink-0 text-fg-subtle" strokeWidth={1.75} />
            <span className="min-w-0">
              <span className="block text-sm text-fg">{s.title}</span>
              <span className="line-clamp-1 text-xs text-fg-subtle">{s.prompt}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
