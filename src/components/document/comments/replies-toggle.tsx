type RepliesToggleProps = {
  count: number;
  expanded: boolean;
  onToggle: () => void;
};

export function RepliesToggle({ count, expanded, onToggle }: RepliesToggleProps) {
  if (!count) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
    >
      <span className={`text-[0.8rem] transition ${expanded ? "rotate-180" : "rotate-0"}`}>▼</span>
      <span>{count === 1 ? `Ver resposta (${count})` : `Ver respostas (${count})`}</span>
    </button>
  );
}
