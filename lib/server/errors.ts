import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

/** Envolve um handler: converte erros em JSON com mensagem em PT-BR, nunca stack trace. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ApiError) {
        return NextResponse.json({ error: { code: e.code, message: e.message, details: e.details } }, { status: e.status });
      }
      if (e instanceof ZodError) {
        return NextResponse.json(
          { error: { code: "invalid_request", message: "Requisição inválida.", details: e.issues.map((i) => i.message) } },
          { status: 400 },
        );
      }
      console.error("[api] erro inesperado", e);
      return NextResponse.json({ error: { code: "internal", message: "Algo deu errado no servidor. Tente de novo." } }, { status: 500 });
    }
  };
}
