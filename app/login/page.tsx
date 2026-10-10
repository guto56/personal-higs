import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-[320px]">
        <div className="mb-8 flex items-center gap-2.5">
          <span aria-hidden className="grid size-7 place-items-center rounded-md border border-border-strong bg-surface-1">
            <span className="size-3 rounded-[3px] border-2 border-accent" />
          </span>
          <span className="text-base font-medium tracking-tight">Studio</span>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
