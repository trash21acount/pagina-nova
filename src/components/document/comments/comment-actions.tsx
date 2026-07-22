"use client";

import { useEffect, useRef, useState } from "react";
import { FloatingPortal } from "@/components/document/comments/floating-portal";

type CommentActionsProps = {
  canManage?: boolean;
  canEdit?: boolean;
  isEditing?: boolean;
  isLocked?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

type MenuRegistry = {
  activeId: string | null;
  listeners: Set<(nextId: string | null) => void>;
};

const menuRegistry: MenuRegistry = {
  activeId: null,
  listeners: new Set(),
};

function setActiveMenu(nextId: string | null) {
  menuRegistry.activeId = nextId;
  menuRegistry.listeners.forEach((listener) => listener(nextId));
}

function subscribeToMenuRegistry(listener: (nextId: string | null) => void) {
  menuRegistry.listeners.add(listener);
  return () => {
    menuRegistry.listeners.delete(listener);
  };
}

export function CommentActions({ canManage, canEdit = true, isEditing, isLocked, onEdit, onDelete }: CommentActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const instanceId = useRef(`comment-actions-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    return subscribeToMenuRegistry((nextId) => {
      if (nextId !== instanceId.current) {
        setIsOpen(false);
      }
    });
  }, []);

  const closeMenu = () => {
    setIsOpen(false);
    if (menuRegistry.activeId === instanceId.current) {
      setActiveMenu(null);
    }
  };

  const openMenu = () => {
    setActiveMenu(instanceId.current);
    setIsOpen(true);
  };

  const handleToggle = () => {
    if (isOpen) {
      closeMenu();
      return;
    }

    openMenu();
  };

  const handleEdit = () => {
    closeMenu();
    onEdit?.();
  };

  const handleDelete = () => {
    closeMenu();
    onDelete?.();
  };

  if (!canManage) {
    return null;
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-zinc-400 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-800 hover:text-zinc-200"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        ⋮
      </button>

      <FloatingPortal
        anchorRef={buttonRef}
        isOpen={isOpen}
        onClose={closeMenu}
        placement="bottom-end"
        offset={{ x: 0, y: 6 }}
        className="min-w-28 rounded-xl border border-white/10 bg-zinc-950/95 p-1 shadow-[0_16px_50px_rgba(0,0,0,0.35)]"
      >
        <div role="menu">
          {!isEditing ? (
            <button
              type="button"
              onClick={handleEdit}
              disabled={!canEdit}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-zinc-300 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLocked ? "Edição bloqueada" : "Editar"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleDelete}
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-zinc-300 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-800 hover:text-white"
          >
            Excluir
          </button>
        </div>
      </FloatingPortal>
    </div>
  );
}
