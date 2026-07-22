import type { OfficialComment as OfficialCommentType } from "@/types/comment";

type OfficialCommentProps = {
  comment: OfficialCommentType;
};

export function OfficialComment({ comment }: OfficialCommentProps) {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.16)] backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.24em] ${comment.author.accent}`}>
          {comment.author.name}
        </span>

        {comment.author.badgeLabel ? (
          <span className="text-[0.68rem] uppercase tracking-[0.24em] text-zinc-500">
            {comment.author.badgeLabel}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-7 text-zinc-300">{comment.text}</p>
    </div>
  );
}
