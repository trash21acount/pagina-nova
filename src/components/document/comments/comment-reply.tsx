import { MarkdownContent } from "@/components/document/markdown-content";

type CommentReplyProps = {
  author: string;
  text: string;
  targetAuthor?: string;
};

export function CommentReply({ author, text, targetAuthor }: CommentReplyProps) {
  const content = targetAuthor ? `@${targetAuthor} ${text}` : text;

  return (
    <div className="rounded-2xl bg-zinc-900/70 p-3">
      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-zinc-500">{author}</p>
      <div className="mt-2 text-sm leading-7 text-zinc-300">
        <MarkdownContent content={content} />
      </div>
    </div>
  );
}
