import type { ReactNode } from "react";

type MarkdownContentProps = {
  content: string;
  className?: string;
  inline?: boolean;
};

function renderInlineMarkdown(content: string): ReactNode[] {
  const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|@([A-Za-z0-9_.-]+))/g).filter((part) => part !== "");

  return parts.map((part, index) => {
    if (/^@/.test(part)) {
      return (
        <span key={`${part}-${index}`} className="whitespace-nowrap text-sky-400">
          {part}
        </span>
      );
    }

    if (/^\*\*.+\*\*$/.test(part)) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (/^\*.+\*$/.test(part)) {
      return (
        <em key={`${part}-${index}`} className="italic text-zinc-200">
          {part.slice(1, -1)}
        </em>
      );
    }

    if (/^`.+`$/.test(part)) {
      return (
        <code key={`${part}-${index}`} className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[0.9em] text-emerald-300">
          {part.slice(1, -1)}
        </code>
      );
    }

    if (/^\s+$/.test(part)) {
      return (
        <span key={`${part}-${index}`} className="whitespace-pre">
          {part}
        </span>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export function MarkdownContent({ content, className, inline = false }: MarkdownContentProps) {
  if (inline) {
    return <span className={`break-words ${className ?? ""}`.trim()}>{renderInlineMarkdown(content)}</span>;
  }

  const lines = content.split("\n");

  return (
    <div className={className}>
      {lines.map((line, index) => {
        if (!line.trim()) {
          return <div key={`${line}-${index}`} className="h-2" />;
        }

        return (
          <p key={`${line}-${index}`} className="break-words leading-7">
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}
