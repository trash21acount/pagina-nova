"use client";

import { useEffect, useMemo, useState } from "react";
import { useLogin } from "@/hooks/use-login";
import { useRouter } from "next/navigation";
import { AccountActionsMenu } from "@/components/login/account-actions-menu";

type TabKey = "users" | "comments" | "requests" | "logs";

type UserSummary = {
  id: string;
  username: string;
  displayName: string;
  status: string;
  role: string;
  registrationReason?: string | null;
  createdAt: string;
  deletedAt?: string | null;
};

type CommentSummary = {
  id: string;
  author: string;
  content: string;
  repliesCount: number;
  likesCount: number;
  createdAt: string;
};

type RequestSummary = {
  id: string;
  username: string;
  registrationReason?: string | null;
  createdAt: string;
};

type LogEntry = {
  id: string;
  action: string;
  target: string;
  details?: string | null;
  createdAt: string;
  actor?: string | null;
};

export function AdminDashboard() {
  const { user, isAuthenticated } = useLogin();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("requests");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [comments, setComments] = useState<CommentSummary[]>([]);
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalState, setModalState] = useState<{ open: boolean; mode: "name" | "password" | "delete" | "restore" | "hard-delete"; userId: string | null; title: string }>({ open: false, mode: "name", userId: null, title: "Alterar nome" });
  const [nameValue, setNameValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [notice, setNotice] = useState("");
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);

  const isAdmin = useMemo(() => Boolean(isAuthenticated && user?.permissions?.includes("admin:access")), [isAuthenticated, user?.permissions]);
  const visibleUsers = useMemo(() => {
    if (showDeletedUsers) {
      return users;
    }

    return users.filter((userItem) => !userItem.deletedAt);
  }, [showDeletedUsers, users]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    if (!isAdmin) {
      router.replace("/");
      return;
    }

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin", { method: "GET" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error ?? "Falha ao carregar painel.");
        }

        setUsers(payload.users ?? []);
        setComments(payload.comments ?? []);
        setRequests(payload.requests ?? []);
        setLogs(payload.logs ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar painel.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [isAdmin, isAuthenticated, refreshKey, router]);

  const getUserActionMenuState = (userItem: UserSummary) => {
    const isDeleted = Boolean(userItem.deletedAt);

    return {
      showNameAction: true,
      showPasswordAction: true,
      showDeleteAction: !isDeleted,
      showRestoreAction: isDeleted,
      showHardDeleteAction: isDeleted,
    };
  };

  const handleAction = async (action: "approve" | "reject", userId: string) => {
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao atualizar solicitação.");
      }

      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar solicitação.");
    }
  };

  const handleCommentAction = async (commentId: string, action: "edit" | "delete") => {
    if (action === "delete") {
      const confirmed = window.confirm("Remover este comentário?");
      if (!confirmed) {
        return;
      }
    } else {
      const nextContent = window.prompt("Novo conteúdo do comentário:", "");
      if (nextContent == null || !nextContent.trim()) {
        return;
      }

      try {
        const response = await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "comment-edit", commentId, content: nextContent.trim() }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error ?? "Falha ao atualizar comentário.");
        }

        setRefreshKey((current) => current + 1);
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao atualizar comentário.");
        return;
      }
    }

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment-delete", commentId }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao atualizar comentário.");
      }

      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar comentário.");
    }
  };

  const resetAdminModal = () => {
    setModalState({ open: false, mode: "name", userId: null, title: "Alterar nome" });
    setNameValue("");
    setPasswordValue("");
    setAdminPassword("");
    setDeleteConfirmed(false);
    setNotice("");
  };

  const openAdminModal = (mode: "name" | "password" | "delete" | "restore" | "hard-delete", userId: string) => {
    const title = mode === "name" ? "Alterar nome" : mode === "password" ? "Alterar senha" : mode === "restore" ? "Restaurar usuário" : mode === "hard-delete" ? "Excluir permanentemente" : "Excluir usuário";
    setModalState({ open: true, mode, userId, title });
    setNameValue("");
    setPasswordValue("");
    setAdminPassword("");
    setDeleteConfirmed(false);
    setNotice("");
  };

  const handleUserAction = async () => {
    if (!modalState.userId) {
      return;
    }

    try {
      let payloadBody: Record<string, string> = { userId: modalState.userId };

      if (modalState.mode === "name") {
        const nextName = nameValue.trim();
        if (!nextName) {
          setNotice("Informe um nome válido.");
          return;
        }
        payloadBody = { userId: modalState.userId, displayName: nextName };
      }

      if (modalState.mode === "password") {
        const nextPassword = passwordValue.trim();
        if (!nextPassword) {
          setNotice("Informe uma senha válida.");
          return;
        }
        payloadBody = { userId: modalState.userId, password: nextPassword };
      }

      if (modalState.mode === "delete") {
        if (!deleteConfirmed) {
          setNotice("Confirme a exclusão do usuário.");
          return;
        }
        payloadBody = { userId: modalState.userId, adminPassword };
      }

      if (modalState.mode === "hard-delete") {
        if (!deleteConfirmed) {
          setNotice("Confirme a exclusão permanente do usuário.");
          return;
        }
        payloadBody = { userId: modalState.userId, adminPassword };
      }

      const action = modalState.mode === "name" ? "user-edit-name" : modalState.mode === "password" ? "user-edit-password" : modalState.mode === "restore" ? "user-restore" : modalState.mode === "hard-delete" ? "user-delete-permanently" : "user-delete";

      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payloadBody }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao atualizar usuário.");
      }

      setRefreshKey((current) => current + 1);
      resetAdminModal();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Falha ao atualizar usuário.");
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 text-zinc-100 shadow-[0_16px_50px_rgba(0,0,0,0.24)] backdrop-blur">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-zinc-500">Painel administrativo</p>
          <h1 className="mt-2 text-2xl font-semibold">Administração</h1>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: "users", label: "Usuários" },
          { key: "comments", label: "Comentários" },
          { key: "requests", label: "Solicitações" },
          { key: "logs", label: "Logs" },
        ].map((tab) => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key as TabKey)} className={`rounded-full px-4 py-2 text-sm ${activeTab === tab.key ? "bg-zinc-100 text-zinc-950" : "bg-zinc-900 text-zinc-300"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <p className="mb-4 text-sm text-rose-300">{error}</p> : null}
      {loading ? <p className="text-sm text-zinc-400">Carregando…</p> : null}

      {!loading && activeTab === "requests" ? (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-zinc-900/80">
              <tr>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Motivo</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-zinc-950/60">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-3">{request.username}</td>
                  <td className="px-4 py-3">{request.registrationReason ?? "—"}</td>
                  <td className="px-4 py-3">{new Date(request.createdAt).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleAction("approve", request.id)} className="rounded-full bg-emerald-500/20 px-3 py-1.5 text-emerald-300">Aprovar</button>
                      <button type="button" onClick={() => handleAction("reject", request.id)} className="rounded-full bg-rose-500/20 px-3 py-1.5 text-rose-300">Recusar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && activeTab === "comments" ? (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-zinc-900/80">
              <tr>
                <th className="px-4 py-3 text-left">Autor</th>
                <th className="px-4 py-3 text-left">Comentário</th>
                <th className="px-4 py-3 text-left">Respostas</th>
                <th className="px-4 py-3 text-left">Curtidas</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-zinc-950/60">
              {comments.map((comment) => (
                <tr key={comment.id}>
                  <td className="px-4 py-3">{comment.author}</td>
                  <td className="px-4 py-3">{comment.content}</td>
                  <td className="px-4 py-3">{comment.repliesCount}</td>
                  <td className="px-4 py-3">{comment.likesCount}</td>
                  <td className="px-4 py-3">{new Date(comment.createdAt).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleCommentAction(comment.id, "edit")} className="rounded-full bg-zinc-800 px-3 py-1.5">Editar</button>
                      <button type="button" onClick={() => handleCommentAction(comment.id, "delete")} className="rounded-full bg-rose-500/20 px-3 py-1.5 text-rose-300">Remover</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && activeTab === "users" ? (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="flex justify-end border-b border-white/10 bg-zinc-900/80 px-4 py-3">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={showDeletedUsers} onChange={(event) => setShowDeletedUsers(event.target.checked)} />
              <span>Mostrar usuários deletados</span>
            </label>
          </div>
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-zinc-900/80">
              <tr>
                <th className="px-4 py-3 text-left">Usuário</th>
                <th className="px-4 py-3 text-left">Nome de exibição</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Função</th>
                <th className="px-4 py-3 text-left">Criado em</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-zinc-950/60">
              {visibleUsers.map((userItem) => {
                const userActionMenuState = getUserActionMenuState(userItem);

                return (
                  <tr key={userItem.id}>
                    <td className="px-4 py-3">{userItem.username}</td>
                    <td className="px-4 py-3">{userItem.displayName}</td>
                    <td className="px-4 py-3">{userItem.status}</td>
                    <td className="px-4 py-3">{userItem.role}</td>
                    <td className="px-4 py-3">{new Date(userItem.createdAt).toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      <div className="relative flex justify-end">
                        <AccountActionsMenu
                          onSelect={(action) => openAdminModal(action, userItem.id)}
                          buttonLabel={`Ações para ${userItem.username}`}
                          className="relative"
                          menuClassName="right-0 left-auto"
                          nameLabel="Alterar nome"
                          passwordLabel="Alterar senha"
                          deleteLabel="Excluir usuário"
                          restoreLabel="Restaurar usuário"
                          hardDeleteLabel="Excluir permanentemente"
                          showNameAction={userActionMenuState.showNameAction}
                          showPasswordAction={userActionMenuState.showPasswordAction}
                          showDeleteAction={userActionMenuState.showDeleteAction}
                          showRestoreAction={userActionMenuState.showRestoreAction}
                          showHardDeleteAction={userActionMenuState.showHardDeleteAction}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {modalState.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-[360px] rounded-[1.4rem] border border-white/10 bg-zinc-950/95 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.24)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100">{modalState.title}</h3>
              <button type="button" onClick={resetAdminModal} className="rounded-full px-2 py-1 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200">✕</button>
            </div>

            {modalState.mode === "name" ? (
              <>
                <label className="mb-2 block text-sm text-zinc-300">Novo nome de exibição</label>
                <input value={nameValue} onChange={(event) => setNameValue(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500" />
              </>
            ) : null}

            {modalState.mode === "password" ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm text-zinc-300">Nova senha</label>
                  <input type="password" value={passwordValue} onChange={(event) => setPasswordValue(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500" />
                </div>
              </div>
            ) : null}

            {modalState.mode === "delete" || modalState.mode === "hard-delete" ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">{modalState.mode === "hard-delete" ? "Informe a senha do administrador para confirmar a exclusão permanente." : "Informe a senha do administrador para confirmar a exclusão."}</p>
                <input type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500" />
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input type="checkbox" checked={deleteConfirmed} onChange={(event) => setDeleteConfirmed(event.target.checked)} />
                  <span>{modalState.mode === "hard-delete" ? "Confirmo a exclusão permanente do usuário" : "Confirmo a exclusão do usuário"}</span>
                </label>
              </div>
            ) : null}

            {modalState.mode === "restore" ? (
              <p className="text-sm text-zinc-400">A conta será restaurada com o nome e usuário originais.</p>
            ) : null}

            {notice ? <p className="mt-3 text-sm text-amber-300">{notice}</p> : null}

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={resetAdminModal} className="rounded-full border border-white/10 px-3 py-2 text-sm text-zinc-300">Cancelar</button>
              <button type="button" onClick={() => void handleUserAction()} className={`rounded-full px-3 py-2 text-sm font-medium ${modalState.mode === "delete" || modalState.mode === "hard-delete" ? "bg-rose-500/20 text-rose-300" : modalState.mode === "restore" ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-100 text-zinc-900"}`}>
                {modalState.mode === "delete" || modalState.mode === "hard-delete" ? "Excluir" : modalState.mode === "restore" ? "Restaurar" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "logs" ? (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-zinc-900/80">
              <tr>
                <th className="px-4 py-3 text-left">Ação</th>
                <th className="px-4 py-3 text-left">Alvo</th>
                <th className="px-4 py-3 text-left">Detalhes</th>
                <th className="px-4 py-3 text-left">Autor</th>
                <th className="px-4 py-3 text-left">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-zinc-950/60">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3">{log.target}</td>
                  <td className="px-4 py-3">{log.details ?? "—"}</td>
                  <td className="px-4 py-3">{log.actor ?? "—"}</td>
                  <td className="px-4 py-3">{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
