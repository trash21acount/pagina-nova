import type { PendingComment as PendingCommentType } from "@/types/comment";

type PendingCommentProps = {
  comment: PendingCommentType;
};

export function PendingComment({ comment }: PendingCommentProps) {
  return (
    <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm shadow-sm backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-medium text-emerald-200">{comment.authorName}</span>
        <span className="text-[0.7rem] uppercase tracking-[0.24em] text-emerald-200/70">
          Comentário publicado
        </span>
      </div>

      <p className="leading-7 text-emerald-100/90">{comment.text}</p>
    </div>
  );
}
