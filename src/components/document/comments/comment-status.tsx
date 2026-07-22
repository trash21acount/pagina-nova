type EditorReviewBadgeProps = {
  label?: string;
};

export function EditorReviewBadge({ label = "Editado pelo editor" }: EditorReviewBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[0.66rem] font-medium uppercase tracking-[0.22em] text-amber-300">
      {label}
    </span>
  );
}

type RemovedNoticeProps = {
  label: string;
};

export function RemovedNotice({ label }: RemovedNoticeProps) {
  return (
    <div className="inline-flex w-fit max-w-full items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[0.82rem] leading-5 text-zinc-400">
      {label}
    </div>
  );
}
