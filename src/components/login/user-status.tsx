"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BiMessageSquareDetail } from "react-icons/bi";
import { useLogin } from "@/hooks/use-login";
import { AccountActionsMenu, type AccountAction } from "@/components/login/account-actions-menu";

const statusPulseStyles = `
  @keyframes statusPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.35); opacity: 0.55; }
  }
`;

type UserStatusProps = {
  name: string;
  onLogout: () => void;
  isAdmin?: boolean;
};

export function UserStatus({ name, onLogout, isAdmin = false }: UserStatusProps) {
  const { updateUserDisplayName } = useLogin();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<"name" | "password" | "delete">("name");
  const [nameValue, setNameValue] = useState(name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [notice, setNotice] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [modalShouldRender, setModalShouldRender] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setNameValue(name);
  }, [name]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      setModalShouldRender(true);
      const raf = requestAnimationFrame(() => setModalVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    setModalVisible(false);
    const timeout = setTimeout(() => setModalShouldRender(false), 250);
    return () => clearTimeout(timeout);
  }, [isModalOpen]);

  const resetModal = () => {
    setMode("name");
    setCurrentPassword("");
    setNewPassword("");
    setDeletePassword("");
    setDeleteConfirmed(false);
    setNotice("");
  };

  const openModal = (action: AccountAction) => {
    if (action === "name" || action === "password" || action === "delete") {
      setMode(action);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetModal();
  };

  const handleSubmit = async () => {
    try {
      if (mode === "name") {
        const response = await fetch("/api/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "change-name", displayName: nameValue.trim() }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error ?? "Falha ao alterar nome.");
        }
        updateUserDisplayName(nameValue.trim());
        setNotice("Nome de exibição alterado.");
        setTimeout(() => closeModal(), 500);
        return;
      }

      if (mode === "password") {
        const response = await fetch("/api/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "change-password", currentPassword, newPassword }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error ?? "Falha ao alterar senha.");
        }
        setNotice("Senha alterada.");
        setTimeout(() => closeModal(), 500);
        return;
      }

      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-account", password: deletePassword, confirmed: deleteConfirmed }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao excluir conta.");
      }
      setNotice("Conta excluída.");
      setTimeout(() => {
        onLogout();
      }, 300);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha na operação.");
    }
  };

  return (
    <>
      <style jsx global>{statusPulseStyles}</style>

      <div className="flex w-full max-w-[340px] items-center gap-3 rounded-full border border-white/10 bg-[#0a0a0c]/90 py-2.5 pl-4 pr-2.5 shadow-[0_16px_50px_rgba(0,0,0,0.24)] backdrop-blur">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="absolute inset-0 rounded-full bg-[rgba(0,170,255,0.9)] animate-[statusPulse_2s_ease-in-out_infinite]" />
        </span>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-medium text-white">{name}</span>
            <span className="shrink-0 rounded-full bg-[rgba(0,170,255,0.14)] px-2 py-[2px] text-[10.5px] font-semibold uppercase tracking-wide text-[rgb(120,200,255)]">
              Conectado
            </span>
          </div>
          <span className="block truncate text-[12.5px] text-white/40">@{name.toLowerCase().replace(/\s+/g, "")}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            aria-label="Mensagens"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.08] hover:text-white"
          >
            <BiMessageSquareDetail className="h-[21px] w-[21px]" />
          </button>
          <AccountActionsMenu
            onSelect={openModal}
            buttonLabel="Abrir configurações"
            showRestoreAction={false}
            showHardDeleteAction={false}
            adminHref={isAdmin ? "/admin" : undefined}
            onLogout={onLogout}
          />
        </div>
      </div>

      {modalShouldRender && isMounted && typeof document !== "undefined"
        ? createPortal(
            <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,6,6,0.72)] px-4 backdrop-blur-[16px] transition-all duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${modalVisible ? "opacity-100" : "opacity-0"}`}>
              <div className={`relative w-full max-w-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-[#040405]/90 p-6 shadow-[0_24px_48px_rgba(0,0,0,0.24),0_8px_16px_rgba(0,0,0,0.16)] transition-all duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${modalVisible ? "scale-100 opacity-100" : "scale-[0.96] opacity-0"}`}>
                <div className="absolute top-[-30px] right-[-30px] h-[170px] w-[170px] rounded-full bg-[rgba(0,170,255,0.16)] opacity-70 blur-[48px]" />
                <div className="absolute bottom-[-50px] left-[-50px] h-[210px] w-[210px] rounded-full bg-[rgba(255,255,255,0.08)] opacity-70 blur-[48px]" />

                <div className="relative z-[2]">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-zinc-100">
                      {mode === "name" ? "Alterar nome" : mode === "password" ? "Alterar senha" : "Excluir conta"}
                    </h3>
                    <button type="button" onClick={closeModal} className="rounded-full px-2 py-1 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200">✕</button>
                  </div>

                  {mode === "name" ? (
                    <>
                      <label className="mb-2 block text-sm text-zinc-300">Novo nome de exibição</label>
                      <input
                        value={nameValue}
                        onChange={(event) => setNameValue(event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                      />
                    </>
                  ) : null}

                  {mode === "password" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-2 block text-sm text-zinc-300">Senha atual</label>
                        <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm text-zinc-300">Nova senha</label>
                        <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500" />
                      </div>
                    </div>
                  ) : null}

                  {mode === "delete" ? (
                    <div className="space-y-3">
                      <p className="text-sm text-zinc-400">Digite sua senha atual para confirmar a exclusão.</p>
                      <input type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500" />
                      <label className="flex items-center gap-2 text-sm text-zinc-300">
                        <input type="checkbox" checked={deleteConfirmed} onChange={(event) => setDeleteConfirmed(event.target.checked)} />
                        <span>Confirmo a exclusão da conta</span>
                      </label>
                    </div>
                  ) : null}

                  {notice ? <p className="mt-3 text-sm text-amber-300">{notice}</p> : null}

                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={closeModal} className="rounded-full border border-white/10 px-3 py-2 text-sm text-zinc-300">Cancelar</button>
                    <button type="button" onClick={() => void handleSubmit()} className={`rounded-full px-3 py-2 text-sm font-medium ${mode === "delete" ? "bg-rose-500/20 text-rose-300" : "bg-zinc-100 text-zinc-900"}`}>
                      {mode === "delete" ? "Excluir" : "Salvar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
