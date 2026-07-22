"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MarkdownContent } from "@/components/document/markdown-content";
import { CommentComposer } from "@/components/document/comment-composer";
import { CommentHeader } from "@/components/document/comments/comment-header";
import { CommentActions } from "@/components/document/comments/comment-actions";
import { LikeButton } from "@/components/document/comments/like-button";
import { FloatingPortal } from "@/components/document/comments/floating-portal";
import { EditorReviewBadge, RemovedNotice } from "@/components/document/comments/comment-status";
import { countDiscussionComments } from "@/components/document/discussion-utils";
import type { DocumentItem } from "@/types/document";

type CommentThreadProps = {
  item: DocumentItem;
  depth?: number;
  isExpanded?: boolean;
  compactRootContainer?: boolean;
  onDiscussionTreeChanged?: () => void;
  onRepliesVisibilityChanged?: (threadElement: HTMLElement | null, isExpanded: boolean) => void;
  onReplyComposerVisibilityChanged?: (threadElement: HTMLElement | null, isReplying: boolean) => void;
  resetRepliesExpansionVersion?: number;
  onDeleteReply?: (replyId: string) => void;
  onToggleLike?: (commentId: string) => Promise<void> | void;
  onSubmitReply?: (content: string, parentId: string) => Promise<void> | void;
  onSaveEdit?: (commentId: string, content: string) => Promise<void> | void;
  onDeleteComment?: (commentId: string) => Promise<void> | void;
  onModerateComment?: (action: string, commentId: string) => Promise<void> | void;
  canAct?: boolean;
  isAuthenticated?: boolean;
  currentUserName?: string | null;
  currentUsername?: string | null;
  canManage?: boolean;
  isAdminUser?: boolean;
  canEdit?: boolean;
  isEditorLocked?: boolean;
  requestLogin?: (onSuccess: () => void, message?: string) => void;
  currentUserDisplayName?: string | null;
};

function formatReplyCount(count: number) {
  return count === 1 ? "Ver resposta (1)" : `Ver respostas (${count})`;
}

export function CommentThread({
  item,
  depth = 0,
  isExpanded = false,
  compactRootContainer = false,
  onDiscussionTreeChanged,
  onRepliesVisibilityChanged,
  onReplyComposerVisibilityChanged,
  resetRepliesExpansionVersion,
  onDeleteReply,
  onToggleLike,
  onSubmitReply,
  onSaveEdit,
  onDeleteComment,
  onModerateComment,
  canAct = false,
  isAuthenticated = false,
  currentUserName = null,
  currentUsername = null,
  canManage = false,
  isAdminUser = false,
  canEdit = false,
  isEditorLocked = false,
  requestLogin,
  currentUserDisplayName = null,
}: CommentThreadProps) {
  const [isDeleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(item.text ?? "");
  const [replyDraft, setReplyDraft] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ id: string; author: string } | null>(null);
  const [isRepliesExpanded, setIsRepliesExpanded] = useState(Boolean(isExpanded));
  const [notice, setNotice] = useState<string | null>(null);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const previousIsReplyingRef = useRef(false);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    setEditDraft(item.text ?? "");
  }, [item.text]);

  useEffect(() => {
    setIsRepliesExpanded(false);
  }, [resetRepliesExpansionVersion]);

  useEffect(() => {
    if (previousIsReplyingRef.current === isReplying) {
      return;
    }

    previousIsReplyingRef.current = isReplying;

    if (!onReplyComposerVisibilityChanged) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      onReplyComposerVisibilityChanged(rootRef.current, isReplying);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isReplying, onReplyComposerVisibilityChanged]);

  const thread = item;
  const baseLikedBy = useMemo(() => (Array.isArray(item.likedBy) ? item.likedBy.filter(Boolean) : []), [item.likedBy]);
  const likeCount = Math.max(item.likes ?? 0, baseLikedBy.length);
  const isLiked = Boolean(currentUserName && baseLikedBy.includes(currentUserName));
  const tooltipUsers = baseLikedBy;
  const replyCount = countDiscussionComments(thread.replies ?? []);
  const showReplyToggle = depth === 0 && replyCount > 0;
  const shouldRenderReplies = isRepliesExpanded;
  const mentionTarget = thread.type === "reply" && thread.replyTo ? thread.replyTo : undefined;
  const mentionLabel = mentionTarget ? `@${mentionTarget}` : undefined;
  const bodyText = thread.text ?? "";
  const currentCommentId = thread.id;
  const isPlaceholderComment = bodyText === "[Comentário removido pelo editor]" || bodyText === "[Comentário editado pelo editor]";
  const isRemoved = thread.status === "deleted" || thread.status === "deleted-by-editor";
  const canLike = !isPlaceholderComment;
  const isEditorReviewed = thread.editedBy === "editor";
  const isEdited = Boolean(thread.edited);
  const isLuizEditor = (currentUsername ?? "").trim().toLowerCase() === "luiz";
  const showAdminActions = Boolean(isAuthenticated && isAdminUser && isLuizEditor && (isRemoved || isEditorReviewed || isEditorLocked));

  const handleToggleLike = () => {
    if (!isAuthenticated) {
      setNotice("Você precisa estar conectado para curtir este comentário.");
      if (requestLogin) {
        requestLogin(() => {
          setNotice(null);
          if (onToggleLike) {
            void onToggleLike(currentCommentId);
          }
        }, "Você precisa estar conectado para curtir este comentário.");
      }
      return;
    }

    if (!canAct) {
      setNotice("Sua conta ainda está pendente de aprovação.");
      return;
    }

    if (onToggleLike && canLike) {
      void onToggleLike(currentCommentId);
    }
  };

  const performOpenReplyComposer = () => {
    setReplyTarget({ id: currentCommentId, author: thread.author ?? "Comentário" });
    setReplyDraft("");
    setIsReplying(true);
    if (depth === 0) {
      setIsRepliesExpanded(true);
      onDiscussionTreeChanged?.();
    }
  };

  const handleOpenReplyComposer = () => {
    if (!isAuthenticated) {
      setNotice("Você precisa estar conectado para responder este comentário.");
      if (requestLogin) {
        requestLogin(() => {
          setNotice(null);
          performOpenReplyComposer();
        }, "Você precisa estar conectado para responder este comentário.");
      }
      return;
    }

    if (!canAct) {
      setNotice("Sua conta ainda está pendente de aprovação.");
      return;
    }

    performOpenReplyComposer();
  };

  const handleCancelReply = () => {
    setReplyDraft("");
    setIsReplying(false);
    setReplyTarget(null);
  };

  const handleSubmitReply = () => {
    const trimmedValue = replyDraft.trim();

    if (!trimmedValue) {
      setNotice("Escreva algo antes de responder.");
      return;
    }

    if (!isAuthenticated) {
      setNotice("Você precisa estar conectado para responder este comentário.");
      return;
    }

    if (!canAct) {
      setNotice("Sua conta ainda está pendente de aprovação.");
      return;
    }

    if (onSubmitReply) {
      void onSubmitReply(trimmedValue, currentCommentId);
    }

    onDiscussionTreeChanged?.();
    setReplyDraft("");
    setIsReplying(false);
    setReplyTarget(null);
  };

  const handleSaveEdit = () => {
    if (isEditorLocked) {
      setNotice("🔒 Edição bloqueada pelo editor.");
      return;
    }

    const trimmedValue = editDraft.trim();

    if (!trimmedValue) {
      return;
    }

    if (onSaveEdit) {
      void onSaveEdit(currentCommentId, trimmedValue);
    }

    setEditDraft(trimmedValue);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditDraft(thread.text ?? "");
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (depth > 0 && onDeleteReply) {
      onDeleteReply(currentCommentId);
      onDiscussionTreeChanged?.();
      return;
    }

    if (onDeleteComment) {
      void onDeleteComment(currentCommentId);
    }

    onDiscussionTreeChanged?.();
  };

  const handleRemoveReply = (replyId: string) => {
    if (onDeleteReply) {
      onDeleteReply(replyId);
      onDiscussionTreeChanged?.();
      return;
    }

    if (onDeleteComment) {
      void onDeleteComment(replyId);
    }

    onDiscussionTreeChanged?.();
  };

  if (isDeleted) {
    return null;
  }

  const rootContainerClassName = compactRootContainer
    ? "mt-0"
    : depth === 0
      ? "mt-4 rounded-xl border border-t-zinc-800/70 border-l-zinc-800/70 border-r-0 border-b-0 bg-zinc-900/30 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]"
      : "mt-1.5";

  if (isRemoved) {
    return (
      <div ref={rootRef} className={rootContainerClassName} data-comment-thread>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2">
          <RemovedNotice label="Comentário removido pelo editor" />
          {showAdminActions && onModerateComment ? (
            <div className="relative">
              <button ref={adminMenuButtonRef} type="button" onClick={() => setIsAdminMenuOpen((current) => !current)} className="rounded-full border border-amber-400/30 p-1.5 text-zinc-300 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-900/80 hover:text-white" aria-label="Ações de moderação">
                ⋯
              </button>
              <FloatingPortal
                anchorRef={adminMenuButtonRef}
                isOpen={isAdminMenuOpen}
                onClose={() => setIsAdminMenuOpen(false)}
                placement="bottom-start"
                offset={{ x: 0, y: 6 }}
                className="min-w-[11rem] rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-[0_16px_50px_rgba(0,0,0,0.35)]"
              >
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => { setIsAdminMenuOpen(false); void onModerateComment("restore", currentCommentId); }} className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-zinc-200 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-900">Restaurar comentário</button>
                  <button type="button" onClick={() => { setIsAdminMenuOpen(false); void onModerateComment("delete-permanently", currentCommentId); }} className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-rose-300 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-900">Excluir definitivamente</button>
                </div>
              </FloatingPortal>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {showReplyToggle ? (
            <button
              type="button"
              onClick={() => {
                setIsRepliesExpanded((current) => !current);
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-zinc-400 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-800 hover:text-zinc-200"
            >
              <span className="text-[0.8rem] transition-transform duration-200" style={{ transform: shouldRenderReplies ? "rotate(0deg)" : "rotate(180deg)" }} aria-hidden="true">▲</span>
              <span>{formatReplyCount(replyCount)}</span>
            </button>
          ) : null}
          <button type="button" onClick={handleOpenReplyComposer} className="rounded-full px-2.5 py-1 text-zinc-400 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-800 hover:text-zinc-200">
            Responder
          </button>
        </div>

        {isReplying ? (
          <div className="mt-3">
            <CommentComposer
              value={replyDraft}
              onChange={setReplyDraft}
              onSubmit={handleSubmitReply}
              onCancel={handleCancelReply}
              error=""
              maxLength={180}
              authorName={currentUserDisplayName ?? currentUserName ?? "Visitante"}
              title={replyTarget ? `Responder @${replyTarget.author}` : "Responder"}
              description="Escreva sua resposta..."
              placeholder="Escreva sua resposta..."
              submitLabel="Enviar"
            />
          </div>
        ) : null}

        {shouldRenderReplies && thread.replies?.length ? (
          <div className="mt-2 space-y-1.5">
            <div className="space-y-1.5">
              {thread.replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  item={reply}
                  depth={depth + 1}
                  isExpanded={shouldRenderReplies}
                  onDiscussionTreeChanged={onDiscussionTreeChanged}
                  onDeleteReply={handleRemoveReply}
                  onToggleLike={onToggleLike}
                  onSubmitReply={onSubmitReply}
                  onSaveEdit={onSaveEdit}
                  onDeleteComment={onDeleteComment}
                  onModerateComment={onModerateComment}
                  canAct={canAct}
                  isAuthenticated={isAuthenticated}
                  currentUserName={currentUserName}
                  currentUsername={currentUsername}
                  canManage={canManage}
                  isAdminUser={isAdminUser}
                  canEdit={canEdit}
                  isEditorLocked={isEditorLocked}
                  requestLogin={requestLogin}
                  currentUserDisplayName={currentUserDisplayName}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={rootContainerClassName} data-comment-thread>
      {depth === 0 && !compactRootContainer ? (
        <div className="mb-3 border-t border-zinc-800/70 pt-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-zinc-500">Discussão</p>
        </div>
      ) : null}
      <article className={`relative ${depth > 0 ? "mt-1.5" : "mt-0"}`}>
        <div className={`py-0.5 ${depth > 0 ? "border-l border-zinc-800/70 pl-3" : "pl-0"}`}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CommentHeader author={thread.author ?? "Comentário"} />
              {isEditorReviewed ? (
                <div className="flex items-center gap-2">
                  <EditorReviewBadge />
                </div>
              ) : null}
              {showAdminActions && onModerateComment ? (
                <div className="relative">
                  <button ref={adminMenuButtonRef} type="button" onClick={() => setIsAdminMenuOpen((current) => !current)} className="rounded-full border border-amber-400/30 p-1.5 text-zinc-300 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-900/80 hover:text-white" aria-label="Ações de moderação">
                    ⋯
                  </button>
                  <FloatingPortal
                    anchorRef={adminMenuButtonRef}
                    isOpen={isAdminMenuOpen}
                    onClose={() => setIsAdminMenuOpen(false)}
                    placement="bottom-start"
                    offset={{ x: 0, y: 6 }}
                    className="min-w-[11rem] rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-[0_16px_50px_rgba(0,0,0,0.35)]"
                  >
                    <div className="flex flex-col gap-1">
                      {isEditorLocked ? <button type="button" onClick={() => { setIsAdminMenuOpen(false); void onModerateComment("unlock", currentCommentId); }} className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-zinc-200 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-900">Desbloquear edição</button> : null}
                      {thread.originalContent ? <button type="button" onClick={() => { setIsAdminMenuOpen(false); void onModerateComment("restore-original", currentCommentId); }} className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-zinc-200 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-900">Restaurar texto original</button> : null}
                      <button type="button" onClick={() => { setIsAdminMenuOpen(false); window.location.assign("/admin"); }} className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-zinc-200 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-900">Abrir no painel administrativo</button>
                    </div>
                  </FloatingPortal>
                </div>
              ) : null}
            </div>

            {isEditing ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-zinc-950/80 p-3">
                <textarea
                  value={editDraft}
                  onChange={(event) => setEditDraft(event.target.value)}
                  className="min-h-20 w-full resize-none rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={handleCancelEdit} className="rounded-full px-3 py-1.5 text-sm text-zinc-400 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-800 hover:text-zinc-200">
                    Cancelar
                  </button>
                  <button type="button" onClick={handleSaveEdit} className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-white">
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <div className={`text-[0.95rem] leading-7 text-zinc-300 ${mentionTarget ? "mt-1" : "mt-2"}`}>
                {mentionLabel ? (
                  <>
                    <span className="mr-1 whitespace-nowrap text-sky-400">{mentionLabel}</span>
                    <span className="text-zinc-300">
                      <MarkdownContent content={bodyText} inline />
                    </span>
                  </>
                ) : (
                  <MarkdownContent content={bodyText} />
                )}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              {canLike && !isRemoved ? <LikeButton likes={likeCount} liked={isLiked} tooltipUsers={tooltipUsers} onToggle={handleToggleLike} /> : null}

              {isEdited ? <span className="text-[0.75rem] text-zinc-500">• editado</span> : null}

              {showReplyToggle ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsRepliesExpanded((current) => {
                      const nextValue = !current;
                      onRepliesVisibilityChanged?.(rootRef.current, nextValue);
                      return nextValue;
                    });
                    onDiscussionTreeChanged?.();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-zinc-400 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-800 hover:text-zinc-200"
                >
                  <span
                    className="text-[0.8rem] transition-transform duration-200"
                    style={{ transform: shouldRenderReplies ? "rotate(0deg)" : "rotate(180deg)" }}
                    aria-hidden="true"
                  >
                    ▲
                  </span>
                  <span>{formatReplyCount(replyCount)}</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleOpenReplyComposer}
                className="rounded-full px-2.5 py-1 text-zinc-400 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-800 hover:text-zinc-200"
              >
                Responder
              </button>

              {canManage ? (
                <CommentActions canManage={canManage} canEdit={canEdit} isEditing={isEditing} isLocked={isEditorLocked} onEdit={() => setIsEditing(true)} onDelete={handleDelete} />
              ) : null}
            </div>

            {notice ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-amber-300">
                <span>{notice}</span>
                {!isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (requestLogin) {
                        requestLogin(() => {
                          setNotice(null);
                          if (notice?.includes("responder")) {
                            performOpenReplyComposer();
                          } else {
                            handleToggleLike();
                          }
                        }, notice ?? "Você precisa estar conectado para continuar.");
                      }
                    }}
                    className="rounded-full border border-amber-400/40 px-3 py-1 text-xs font-medium text-amber-200 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-amber-400/10"
                  >
                    Fazer login
                  </button>
                ) : null}
              </div>
            ) : null}

            {isReplying ? (
              <div className="mt-3">
                <CommentComposer
                  value={replyDraft}
                  onChange={setReplyDraft}
                  onSubmit={handleSubmitReply}
                  onCancel={handleCancelReply}
                  error=""
                  maxLength={180}
                  authorName={currentUserDisplayName ?? currentUserName ?? "Visitante"}
                  title={replyTarget ? `Responder @${replyTarget.author}` : "Responder"}
                  description="Escreva sua resposta..."
                  placeholder="Escreva sua resposta..."
                  submitLabel="Enviar"
                />
              </div>
            ) : null}

            {shouldRenderReplies && thread.replies?.length ? (
              <div className="mt-1.5 space-y-1.5">
                <div className="space-y-1.5">
                  {thread.replies.map((reply) => (
                    <CommentThread
                      key={reply.id}
                      item={reply}
                      depth={depth + 1}
                      isExpanded={shouldRenderReplies}
                      onDiscussionTreeChanged={onDiscussionTreeChanged}
                      onDeleteReply={handleRemoveReply}
                      onToggleLike={onToggleLike}
                      onSubmitReply={onSubmitReply}
                      onSaveEdit={onSaveEdit}
                      onDeleteComment={onDeleteComment}
                      onModerateComment={onModerateComment}
                      canAct={canAct}
                      isAuthenticated={isAuthenticated}
                      currentUserName={currentUserName}
                      currentUsername={currentUsername}
                      canManage={canManage}
                      isAdminUser={isAdminUser}
                      canEdit={canEdit}
                      isEditorLocked={isEditorLocked}
                      requestLogin={requestLogin}
                      currentUserDisplayName={currentUserDisplayName}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
    </div>
  );
}
