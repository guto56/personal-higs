import type { Metadata } from "next";
import { Library } from "@/components/pages/library";

export const metadata: Metadata = { title: "Biblioteca" };

export default function Page() {
  return <Library />;
}
