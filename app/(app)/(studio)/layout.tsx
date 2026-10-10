import { Studio } from "@/components/studio/studio";

/** O Studio fica no layout: trocar de conversa não remonta o composer. */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Studio />
      {children}
    </>
  );
}
