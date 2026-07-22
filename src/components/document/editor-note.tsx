import { MarkdownContent } from "@/components/document/markdown-content";

type EditorNoteProps = {
  title?: string;
  content: string;
};

export function EditorNote({ title = "Nota do editor", content }: EditorNoteProps) {
  return (
    <aside className="my-5 rounded-2xl border border-emerald-500/30 bg-zinc-950 p-4 shadow-sm ring-1 ring-emerald-500/10 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
          <span className="text-base">i</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-emerald-400/90">
            {title}
          </p>
          <div className="mt-3 space-y-2 text-sm leading-7 text-white/90">
            <MarkdownContent content={content} />
          </div>
        </div>
      </div>
    </aside>
  );
}
