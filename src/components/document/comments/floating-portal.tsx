"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

type Placement = "bottom-start" | "bottom-end" | "bottom-center" | "top-start" | "top-end" | "top-center";

type FloatingPortalProps = {
  anchorRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose?: () => void;
  placement?: Placement;
  offset?: { x?: number; y?: number };
  children: ReactNode;
  className?: string;
  zIndex?: number;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
};

export function FloatingPortal({
  anchorRef,
  isOpen,
  onClose,
  placement = "bottom-start",
  offset,
  children,
  className,
  zIndex = 9999,
  closeOnOutsideClick = true,
  closeOnEscape = true,
}: FloatingPortalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, transform: "translate(0, 0)" });
  const contentRef = useRef<HTMLDivElement | null>(null);
  const offsetX = offset?.x ?? 0;
  const offsetY = offset?.y ?? 0;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    let left = rect.left + offsetX;
    let top = rect.bottom + offsetY;
    let transform = "translate(0, 0)";

    switch (placement) {
      case "bottom-end":
        left = rect.right + offsetX;
        transform = "translate(-100%, 0)";
        break;
      case "bottom-center":
        left = rect.left + rect.width / 2 + offsetX;
        transform = "translate(-50%, 0)";
        break;
      case "top-start":
        top = rect.top - offsetY;
        left = rect.left + offsetX;
        break;
      case "top-end":
        top = rect.top - offsetY;
        left = rect.right + offsetX;
        transform = "translate(-100%, 0)";
        break;
      case "top-center":
        top = rect.top - offsetY;
        left = rect.left + rect.width / 2 + offsetX;
        transform = "translate(-50%, 0)";
        break;
      case "bottom-start":
      default:
        left = rect.left + offsetX;
        top = rect.bottom + offsetY;
        break;
    }

    setPosition({ left, top, transform });
  }, [anchorRef, isOpen, offsetX, offsetY, placement]);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (contentRef.current?.contains(target)) {
        return;
      }

      if (anchorRef.current?.contains(target)) {
        return;
      }

      if (closeOnOutsideClick) {
        onClose?.();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorRef, closeOnEscape, closeOnOutsideClick, isOpen, onClose]);

  if (!isMounted || !isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={contentRef}
      className={`fixed ${className ?? ""}`}
      style={{
        left: position.left,
        top: position.top,
        transform: position.transform,
        zIndex,
        position: "fixed",
        width: "max-content",
        maxWidth: "min(100vw - 1rem, 18rem)",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
