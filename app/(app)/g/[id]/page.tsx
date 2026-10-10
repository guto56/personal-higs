import type { Metadata } from "next";
import { GenerationDetail } from "@/components/pages/generation-detail";

export const metadata: Metadata = { title: "Geração" };

export default async function Page({ params }: PageProps<"/g/[id]">) {
  const { id } = await params;
  return <GenerationDetail id={id} />;
}
