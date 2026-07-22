import { MarkdownContent } from "@/components/document/markdown-content";
import type { DocumentItem } from "@/types/document";

type AnomalyDiscussionBlockProps = {
  item: DocumentItem;
};

export function AnomalyDiscussionBlock({ item }: AnomalyDiscussionBlockProps) {
  return (
    <section className="document-texture-surface mb-6 ml-4 rounded-[1.1rem] border border-white/10 bg-zinc-900/70 p-4 opacity-0 translate-y-1 transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out animation-[fade-in-up_180ms_ease-out_forwards] sm:ml-5 sm:p-5">
      <div className="mb-4">
        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          Discussão parcial
        </p>
        <h3 className="mt-2 text-lg font-semibold text-white">{item.title ?? "Discussão"}</h3>
        {item.description ? (
          <div className="mt-2 text-sm leading-7 text-zinc-400">
            <MarkdownContent content={item.description} />
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        {(item.comments ?? []).map((comment) => (
          <div key={comment.id} className="rounded-[1rem] border border-white/10 bg-zinc-950/50 p-3">
            <p className="text-sm font-medium text-zinc-200">{comment.author ?? "Comentário"}</p>
            <div className="mt-2 text-sm leading-7 text-zinc-300">
              <MarkdownContent content={comment.text ?? ""} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
