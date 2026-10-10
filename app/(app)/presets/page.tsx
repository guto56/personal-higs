import type { Metadata } from "next";
import { Presets } from "@/components/pages/presets";

export const metadata: Metadata = { title: "Presets" };

export default function Page() {
  return <Presets />;
}
