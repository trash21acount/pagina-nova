"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BiLike } from "react-icons/bi";

type LikeButtonProps = {
  likes: number;
  liked: boolean;
  tooltipUsers: string[];
  onToggle: () => void;
};

function OdometerDigit({ digit }: { digit: number }) {
  return (
    <span className="relative inline-block h-[1.1em] w-[0.62em] overflow-hidden align-middle">
      <span
        className="absolute left-0 top-0 flex flex-col transition-transform duration-500"
        style={{ transform: `translateY(-${digit * 10}%)`, transitionTimingFunction: "cubic-bezier(0.68, -0.55, 0.27, 1.55)" }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="flex h-[1.1em] items-center justify-center">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

export function LikeButton({ likes, liked, tooltipUsers, onToggle }: LikeButtonProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const hasTooltip = tooltipUsers.length > 0 || likes > 0;
  const displayCount = Number.isFinite(likes) && likes > 0 ? likes : null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isTooltipVisible) {
      return;
    }

    const updatePosition = () => {
      if (!buttonRef.current) {
        return;
      }

      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.bottom + 10 });
    };

    updatePosition();

    const handleScroll = () => updatePosition();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isTooltipVisible]);

  const showTooltip = () => {
    if (!hasTooltip) {
      return;
    }

    setIsTooltipVisible(true);
  };

  const hideTooltip = () => {
    setIsTooltipVisible(false);
  };

  return (
    <div className="relative z-20 inline-flex items-center overflow-visible">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Curtir comentário"
        onClick={onToggle}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onPointerEnter={showTooltip}
        onPointerLeave={hideTooltip}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] ${
          liked ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900/70 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        }`}
      >
        <BiLike className={`text-base transition-transform duration-200 ${liked ? "scale-110 animate-[likeBurst_350ms_ease-in-out]" : "scale-100"}`} />
        {displayCount !== null ? (
          <span className="flex">
            {String(displayCount)
              .split("")
              .map((char, index) => (Number.isNaN(Number(char)) ? <span key={index}>{char}</span> : <OdometerDigit key={index} digit={Number(char)} />))}
          </span>
        ) : null}
      </button>

      {hasTooltip && isMounted && isTooltipVisible && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-none fixed z-[9999] w-max max-w-[16rem] -translate-x-1/2 rounded-xl border border-white/10 bg-zinc-950/95 px-2.5 py-2 text-sm text-zinc-300 shadow-[0_16px_50px_rgba(0,0,0,0.3)]"
              style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
            >
              <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-zinc-500">{tooltipUsers.length ? "Curtido por" : "Curtidas"}</p>
              {tooltipUsers.length ? (
                <ul className="space-y-1">
                  {tooltipUsers.slice(0, 6).map((name) => (
                    <li key={name}>• {name}</li>
                  ))}
                  {tooltipUsers.length > 6 ? <li className="text-zinc-500">e mais {tooltipUsers.length - 6} pessoas.</li> : null}
                </ul>
              ) : (
                <p>{likes} curtida{likes === 1 ? "" : "s"}</p>
              )}
            </div>,
            document.body,
          )
        : null}
      <style jsx global>{`
        @keyframes likeBurst {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(-10deg); }
        }
      `}</style>
    </div>
  );
}
