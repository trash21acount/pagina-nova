import type { ReactNode } from "react";

type CommentHeaderProps = {
  author: string;
  children?: ReactNode;
};

export function CommentHeader({ author, children }: CommentHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[0.94rem] font-medium text-zinc-100">{author}</span>
      {children}
    </div>
  );
}
