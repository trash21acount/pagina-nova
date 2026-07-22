"use client";

import { useEffect } from "react";
import { useScrollLock } from "@/lib/scroll-lock";
import { IsoCube } from "./iso-cube";

const MESSAGES = [
  "Sincronizando anotações...",
  "Carregando comentários...",
  "Reconstruindo contexto...",
  "Documento pronto.",
];

type LoadingExperienceProps = {
  progress?: number;
  activeIndex?: number;
  isVisible?: boolean;
  onExited?: () => void;
};

export function LoadingExperience({ progress = 0, activeIndex = 0, isVisible = true, onExited }: LoadingExperienceProps) {
  const safeIndex = Math.max(0, Math.min(activeIndex, MESSAGES.length - 1));
  const safeProgress = Math.max(0, Math.min(progress, 100));

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    return useScrollLock(true);
  }, [isVisible]);

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center overflow-hidden bg-[rgba(6,6,6,0.72)] backdrop-blur-[16px] transition-opacity duration-500"
      style={{ opacity: isVisible ? 1 : 0, pointerEvents: isVisible ? "auto" : "none" }}
      onTransitionEnd={(event) => {
        if (event.propertyName === "opacity" && !isVisible) {
          onExited?.();
        }
      }}
    >
      <div className="absolute inset-[8%_10%] pointer-events-none blur-[60px] bg-[radial-gradient(circle,rgba(255,255,255,0.14),transparent_70%)]" />

      <div className="relative w-[min(92vw,560px)] rounded-[30px] border border-white/10 bg-[#040405]/90 px-8 py-9 text-center shadow-[0_24px_48px_rgba(0,0,0,0.24),0_8px_16px_rgba(0,0,0,0.16)] backdrop-blur-[10px]">
        <div className="mx-auto mb-4 flex justify-center">
          <IsoCube scale={0.62} />
        </div>

        <div className="text-[11px] font-medium tracking-[0.34em] uppercase text-white/60">
          Arquivo 001 · Meme-sis
        </div>

        <div className="mt-3 min-h-[1.5rem]">
          <p className="text-[13px] text-white/90 transition-opacity duration-300">{MESSAGES[safeIndex]}</p>
        </div>

        <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
          <span
            className="block h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${safeProgress}%`,
              background: "linear-gradient(90deg, rgba(0,170,255,0.9), rgba(255,255,255,0.4))",
              boxShadow: "0 0 10px rgba(0,170,255,0.4)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
