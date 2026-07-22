import type { DocumentItem } from "@/types/document";

type DefaultBlockProps = {
  item: DocumentItem;
};

export function DefaultBlock({ item }: DefaultBlockProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4 text-sm leading-7 text-zinc-300">
      {item.text}
    </div>
  );
}
