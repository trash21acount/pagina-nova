import { useEffect, useRef } from "react";
import { CommentComposer } from "@/components/document/comment-composer";

type CommentPopupProps = {
  x: number;
  y: number;
  value: string;
  error: string;
  maxLength: number;
  authorName: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function CommentPopup({
  x,
  y,
  value,
  error,
  maxLength,
  authorName,
  onChange,
  onSubmit,
  onCancel,
}: CommentPopupProps) {
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [onCancel]);

  return (
    <div
      ref={popupRef}
      className="fixed z-40 w-[min(320px,calc(100vw-2rem))]"
      style={{ left: x, top: y }}
    >
      <CommentComposer
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        onCancel={onCancel}
        error={error}
        maxLength={maxLength}
        authorName={authorName}
      />
    </div>
  );
}
