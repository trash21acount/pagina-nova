"use client";

import { useEffect, useState, type ReactNode, type TransitionEvent } from "react";
import styles from "./cinematic-transition.module.css";

type Phase = "idle" | "brightening" | "revealing";

type CinematicTransitionProps = {
  active: boolean;
  children?: ReactNode;
  onRevealComplete?: () => void;
};

export function CinematicTransition({ active, children, onRevealComplete }: CinematicTransitionProps) {
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      return;
    }

    setPhase("brightening");
  }, [active]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== "opacity") {
      return;
    }

    if (phase === "brightening") {
      setPhase("revealing");
      return;
    }

    if (phase === "revealing") {
      onRevealComplete?.();
    }
  };

  if (!active && phase === "idle") {
    return null;
  }

  return (
    <div className={styles.shell} aria-hidden="true">
      <div className={`${styles.overlay} ${phase === "brightening" ? styles.brightening : ""} ${phase === "revealing" ? styles.revealing : ""}`} onTransitionEnd={handleTransitionEnd} />
      {children}
    </div>
  );
}
