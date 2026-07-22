"use client";

import { useEffect, useState, type TransitionEvent } from "react";
import styles from "./document-route-transition.module.css";

type DocumentRouteTransitionProps = {
  isActive: boolean;
  phase: "idle" | "loading" | "revealing" | "done";
  onDocumentMounted?: () => void;
};

export function DocumentRouteTransition({ isActive, phase, onDocumentMounted }: DocumentRouteTransitionProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (phase === "revealing" && isActive) {
      setIsMounted(true);
      setIsVisible(true);
      return;
    }

    setIsMounted(false);
    setIsVisible(false);
  }, [isActive, phase]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== "opacity") {
      return;
    }

    if (phase !== "revealing") {
      return;
    }

    onDocumentMounted?.();
    setIsVisible(false);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className={`${styles.overlay} ${isVisible ? styles.visible : styles.hidden}`} aria-hidden="true" onTransitionEnd={handleTransitionEnd}>
      <div className={styles.vignette} />
      <div className={styles.glow} />
    </div>
  );
}
