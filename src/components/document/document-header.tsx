import type { DocumentContent } from "@/types/document";

type DocumentHeaderProps = {
  content: DocumentContent;
};

export function DocumentHeader({ content }: DocumentHeaderProps) {
  return (
    <header className="mb-10 border-b border-white/10 pb-8">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-zinc-500">
        Documento narrado
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        {content.title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
        {content.subtitle}
      </p>
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-zinc-400">
        <span>Por {content.author}</span>
        <span>•</span>
        <span>{content.date}</span>
      </div>
    </header>
  );
}
