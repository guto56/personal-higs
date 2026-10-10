import type { Metadata } from "next";
import { Characters } from "@/components/pages/characters";

export const metadata: Metadata = { title: "Personagens" };

export default function Page() {
  return <Characters />;
}
