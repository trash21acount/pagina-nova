type CommentTooltipProps = {
  likers: string[];
};

export function CommentTooltip({ likers }: CommentTooltipProps) {
  if (!likers.length) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-56 rounded-xl border border-white/10 bg-zinc-950/95 p-3 text-sm text-zinc-300 shadow-xl group-hover:block">
      <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Curtido por
      </p>
      <ul className="space-y-1">
        {likers.slice(0, 5).map((name) => (
          <li key={name}>• {name}</li>
        ))}
        {likers.length > 5 ? <li className="text-zinc-500">e mais {likers.length - 5} pessoas.</li> : null}
      </ul>
    </div>
  );
}
