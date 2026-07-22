import type { ReactNode } from "react";

type PanelCardProps = {
  children: ReactNode;
  className?: string;
};

export function PanelCard({ children, className = "" }: PanelCardProps) {
  return (
    <div
      className={`rounded-[2rem] border border-white/10 bg-zinc-900/75 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}
