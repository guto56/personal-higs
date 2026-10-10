"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ClientApiError } from "@/lib/client/api";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(params.get("expired") ? "Sua sessão expirou. Entre novamente." : null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || pending) return;
    setPending(true);
    setError(null);
    try {
      await api("/api/auth/login", { method: "POST", json: { password } });
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Não foi possível entrar.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor="password" className="text-sm text-fg-muted">
        Senha
      </label>
      <div className="flex gap-2">
        <input
          id="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "password-error" : undefined}
          className="h-9 min-w-0 flex-1 rounded-md border border-border-strong bg-surface-1 px-3 text-base outline-none transition-colors placeholder:text-fg-subtle focus-visible:border-accent focus-visible:outline-none"
        />
        <Button type="submit" variant="primary" size="icon" className="size-9" aria-label="Entrar" disabled={!password || pending}>
          {pending ? <Loader2 className="animate-spin" strokeWidth={1.75} /> : <ArrowRight strokeWidth={1.75} />}
        </Button>
      </div>
      <p id="password-error" role="alert" className="min-h-5 text-sm text-danger">
        {error}
      </p>
    </form>
  );
}
