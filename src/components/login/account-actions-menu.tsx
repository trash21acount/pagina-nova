"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BiCog, BiLockAlt, BiPencil, BiPowerOff, BiTrash } from "react-icons/bi";

export type AccountAction = "name" | "password" | "delete" | "restore" | "hard-delete";

type AccountActionsMenuProps = {
  onSelect: (action: AccountAction) => void;
  buttonLabel?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  nameLabel?: string;
  passwordLabel?: string;
  deleteLabel?: string;
  restoreLabel?: string;
  hardDeleteLabel?: string;
  showNameAction?: boolean;
  showPasswordAction?: boolean;
  showDeleteAction?: boolean;
  showRestoreAction?: boolean;
  showHardDeleteAction?: boolean;
  adminHref?: string;
  onLogout?: () => void;
};

export function AccountActionsMenu({ onSelect, buttonLabel = "Abrir ações", className, buttonClassName, menuClassName, nameLabel = "Alterar nome", passwordLabel = "Alterar senha", deleteLabel = "Excluir conta", restoreLabel = "Restaurar conta", hardDeleteLabel = "Excluir permanentemente", showNameAction = true, showPasswordAction = true, showDeleteAction = true, showRestoreAction = false, showHardDeleteAction = false, adminHref, onLogout }: AccountActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setIsVisible(true));
        rafRef.current = raf2;
      });
      rafRef.current = raf1;
      return () => cancelAnimationFrame(rafRef.current);
    }

    setIsVisible(false);
    const timeout = setTimeout(() => setShouldRender(false), 200);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) {
      return;
    }

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 210,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      const clickedInsidePortal = target instanceof Element && target.closest('[data-account-menu-portal="true"]');
      if (containerRef.current && !containerRef.current.contains(target as Node) && !clickedInsidePortal) {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (action: AccountAction) => {
    setIsOpen(false);
    onSelect(action);
  };

  return (
    <div className={`relative ${className ?? ""}`} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`menuToggle flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-zinc-900/80 transition hover:bg-zinc-800 ${isOpen ? "menuToggleOpen" : ""} ${buttonClassName ?? ""}`}
        aria-label={buttonLabel}
      >
        <svg viewBox="0 0 32 32" className="menuToggleSvg" aria-hidden="true">
          <path
            className="menuToggleLine menuToggleLineTopBottom"
            d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
          />
          <path className="menuToggleLine" d="M7 16 27 16" />
        </svg>
      </button>

      {shouldRender && isMounted && typeof document !== "undefined"
        ? createPortal(
            <div
              data-account-menu-portal="true"
              style={{ position: "fixed", top: menuPosition.top, left: menuPosition.left }}
              className={`z-[1000] w-[210px] overflow-hidden rounded-[14px] border border-white/10 bg-gradient-to-br from-[#0d1015] to-[#04070a] p-2.5 shadow-[0_16px_50px_rgba(0,0,0,0.35)] transition-opacity duration-200 ease-out ${isVisible ? "opacity-100" : "opacity-0"} ${menuClassName ?? ""}`}
            >
              <ul className="menuList flex flex-col gap-1">
                {showNameAction ? (
                  <li>
                    <button type="button" onClick={() => handleSelect("name")} className="menuItem">
                      <BiPencil className="menuIcon" />
                      <span>{nameLabel}</span>
                    </button>
                  </li>
                ) : null}
                {showPasswordAction ? (
                  <li>
                    <button type="button" onClick={() => handleSelect("password")} className="menuItem">
                      <BiLockAlt className="menuIcon" />
                      <span>{passwordLabel}</span>
                    </button>
                  </li>
                ) : null}
              </ul>

              {adminHref ? (
                <>
                  <div className="menuSeparator" />
                  <ul className="menuList flex flex-col gap-1">
                    <li>
                      <Link href={adminHref} className="menuItem menuItemAdmin">
                        <BiCog className="menuIcon" />
                        <span>Admin</span>
                      </Link>
                    </li>
                  </ul>
                </>
              ) : null}

              <div className="menuSeparator" />
              <ul className="menuList flex flex-col gap-1">
                {showDeleteAction ? (
                  <li>
                    <button type="button" onClick={() => handleSelect("delete")} className="menuItem menuItemDanger">
                      <BiTrash className="menuIcon" />
                      <span>{deleteLabel}</span>
                    </button>
                  </li>
                ) : null}
                {onLogout ? (
                  <li>
                    <button type="button" onClick={onLogout} className="menuItem menuItemDanger">
                      <BiPowerOff className="menuIcon" />
                      <span>Sair</span>
                    </button>
                  </li>
                ) : null}
              </ul>
            </div>,
            document.body,
          )
        : null}

      <style jsx global>{`
            .menuItem {
              display: flex;
              width: 100%;
              align-items: center;
              gap: 10px;
              border-radius: 8px;
              padding: 8px 10px;
              font-size: 14px;
              font-weight: 500;
              color: rgba(255, 255, 255, 0.75);
              position: relative;
              transition: background-color 0.25s, color 0.25s, transform 0.25s;
              text-decoration: none;
            }
            .menuItem::before {
              content: "";
              position: absolute;
              left: 0;
              top: 15%;
              width: 3px;
              height: 70%;
              border-radius: 3px;
              background: rgb(0, 170, 255);
              opacity: 0;
              transition: opacity 0.25s;
            }
            .menuItem:hover {
              background-color: rgba(0, 170, 255, 0.12);
              color: #fff;
              transform: translateX(1px);
            }
            .menuItem:hover::before {
              opacity: 1;
            }
            .menuItem:active {
              transform: scale(0.98);
            }
            .menuItemDanger:hover {
              background-color: rgba(190, 40, 40, 0.18);
            }
            .menuItemDanger:hover::before {
              background: rgb(240, 90, 90);
            }
            .menuToggleSvg {
              height: 22px;
              transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
            }
            .menuToggleLine {
              fill: none;
              stroke: rgba(255, 255, 255, 0.7);
              stroke-linecap: round;
              stroke-linejoin: round;
              stroke-width: 3;
              transition: stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
            }
            .menuToggleLineTopBottom {
              stroke-dasharray: 12 63;
            }
            .menuToggleOpen .menuToggleSvg {
              transform: rotate(-45deg);
            }
            .menuToggleOpen .menuToggleLineTopBottom {
              stroke-dasharray: 20 300;
              stroke-dashoffset: -32.42;
            }
            .menuIcon {
              font-size: 12px;
              width: 17px;
              height: 17px;
              text-align: center;
            }
            .menuSeparator {
              margin: 6px 2px;
              border-top: 1px solid rgba(255, 255, 255, 0.08);
            }
          `}</style>
    </div>
  );
}
