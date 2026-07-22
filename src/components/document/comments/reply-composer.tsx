"use client";

type ReplyComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function ReplyComposer({ value, onChange, onCancel, onSubmit }: ReplyComposerProps) {
  return (
    <div className="mt-3">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Adicionar comentário"
        className="min-h-20 w-full resize-none rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none"
      />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200">
          Cancelar
        </button>
        <button type="button" onClick={onSubmit} className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white">
          Publicar
        </button>
      </div>
    </div>
  );
}
