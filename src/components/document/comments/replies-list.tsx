import { MarkdownContent } from "@/components/document/markdown-content";

type RepliesListProps = {
  replies: Array<{ author: string; text: string }>;
  expanded: boolean;
};

export function RepliesList({ replies, expanded }: RepliesListProps) {
  if (!replies.length || !expanded) {
    return null;
  }

  return (
    <div className="mt-3 border-l border-zinc-800/90 pl-4">
      <div className="space-y-2">
        {replies.map((reply, index) => (
          <div key={`${reply.author}-${index}`} className="rounded-2xl bg-zinc-900/70 p-3">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-zinc-500">
              {reply.author}
            </p>
            <div className="mt-2 text-sm leading-7 text-zinc-300">
              <MarkdownContent content={reply.text} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
