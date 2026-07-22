import { useEffect, useRef, useState } from "react";

type LoginPromptPopoverProps = {
  x: number;
  y: number;
  message?: string;
  onOpenLogin: () => void;
  onClose: () => void;
};

export function LoginPromptPopover({ x, y, message, onOpenLogin, onClose }: LoginPromptPopoverProps) {
  const [isVisible, setIsVisible] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 20);
    const handlePointerDown = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className={`fixed z-40 w-[min(280px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.26)] backdrop-blur transition-all duration-200 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
      style={{ left: x, top: y }}
    >
      <p className="text-sm leading-7 text-zinc-200">{message ?? "Você precisa estar conectado para continuar."}</p>

      <button
        type="button"
        onClick={onOpenLogin}
        className="mt-3 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white"
      >
        Fazer login
      </button>
    </div>
  );
}
