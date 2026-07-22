import { useEffect, useRef, useState } from "react";
import { CharacterCounter } from "@/components/document/character-counter";

type CommentComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  error: string;
  maxLength: number;
  authorName: string;
  title?: string;
  description?: string;
  placeholder?: string;
  submitLabel?: string;
};

export function CommentComposer({
  value,
  onChange,
  onSubmit,
  onCancel,
  error,
  maxLength,
  authorName,
  title = "Adicionar comentário",
  description = "Compartilhe sua opinião sobre este trecho.",
  placeholder = "Escreva um comentário sobre este trecho.",
  submitLabel = "Enviar",
}: CommentComposerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 20);
    inputRef.current?.focus();

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      data-comment-composer
      className={`rounded-2xl border border-white/10 bg-zinc-950/95 p-3 shadow-[0_16px_50px_rgba(0,0,0,0.26)] backdrop-blur transition-all duration-200 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
    >
      <div className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-zinc-500">
        {title}
      </div>

      <p className="mb-2 text-[0.8rem] leading-5 text-zinc-400">
        {description}
      </p>

      <textarea
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className="min-h-[90px] w-full resize-none rounded-xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
      />

      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <span className="text-zinc-400">{authorName}</span>
        <CharacterCounter value={value} maxLength={maxLength} />
      </div>

      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/5"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
