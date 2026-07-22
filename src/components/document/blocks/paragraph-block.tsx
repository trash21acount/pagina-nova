"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { BiCommentDetail } from "react-icons/bi";
import { CommentPopup } from "@/components/document/comment-popup";
import { OfficialCommentsList } from "@/components/document/official-comments-list";
import { CommentThread } from "@/components/document/comments/comment-thread";
import { officialComments } from "@/data/comments";
import { useComments } from "@/hooks/use-comments";
import { useLogin } from "@/hooks/use-login";
import { countDiscussionComments } from "@/components/document/discussion-utils";
import type { DocumentItem } from "@/types/document";

type ParagraphBlockProps = {
  blockId: string;
  item: DocumentItem;
};

type PersistedComment = {
  id: string;
  paragraphId: string;
  parentId: string | null;
  content: string;
  originalContent?: string | null;
  createdAt: string;
  editedAt: string | null;
  editedBy?: string | undefined;
  editorLocked: boolean;
  deletedAt: string | null;
  deletedBy?: string | undefined;
  authorId: string;
  authorName: string;
  likes: number;
  likedBy: string[];
  replies: PersistedComment[];
};

export function ParagraphBlock({ blockId, item }: ParagraphBlockProps) {
  const [tooltipState, setTooltipState] = useState<{ isVisible: boolean; position: { x: number; y: number } | null }>({
    isVisible: false,
    position: null,
  });
  const initialDiscussionHeight = 160;
  const discussionStep = 220;
  const [discussionVisibleHeight, setDiscussionVisibleHeight] = useState(initialDiscussionHeight);
  const [discussionContentHeight, setDiscussionContentHeight] = useState<number | null>(null);
  const [discussionSyncVersion, setDiscussionSyncVersion] = useState(0);
  const [replyExpansionResetVersion, setReplyExpansionResetVersion] = useState(0);
  const [discussionViewportOverflow, setDiscussionViewportOverflow] = useState<"hidden" | "auto">("hidden");
  const [hasActiveReplyComposer, setHasActiveReplyComposer] = useState(false);
  const [, setPendingComposerTarget] = useState<{ paragraphId: string; position: { x: number; y: number } } | null>(null);
  const discussionContentRef = useRef<HTMLDivElement | null>(null);
  const discussionViewportRef = useRef<HTMLDivElement | null>(null);
  const previousDiscussionContentHeightRef = useRef<number | null>(null);
  const replyExpansionHeightStackRef = useRef<number[]>([]);
  const replyComposerHeightStackRef = useRef<number[]>([]);
  const paragraphId = `${blockId}-${item.id}`;
  const {
    comments,
    composer,
    notice,
    isComposerOpen,
    isLoading,
    MAX_LENGTH,
    user,
    isAuthenticated,
    openComposer,
    closeComposer,
    updateValue,
    submitComment,
    toggleLike,
    editComment,
    deleteComment,
    moderateComment,
  } = useComments(paragraphId);
  const { requestLogin } = useLogin();
  const canAct = Boolean(isAuthenticated && user?.status === "ACTIVE");

  const handleParagraphClick = (event: MouseEvent<HTMLParagraphElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = { x: Math.min(window.innerWidth - 340, rect.left + 16), y: Math.max(24, rect.top + 10) };

    setPendingComposerTarget({ paragraphId, position });

    if (!isAuthenticated) {
      requestLogin(() => {
        openComposer(paragraphId, position);
        setPendingComposerTarget(null);
      }, "Você precisa estar conectado para comentar este documento.");
      return;
    }

    openComposer(paragraphId, position);
  };

  const paragraphOfficialComments = useMemo(() => officialComments.filter((comment) => comment.paragraphId === paragraphId), [paragraphId]);
  const totalDiscussionCount = useMemo(() => countDiscussionComments(comments), [comments]);

  const getNextDiscussionHeight = (currentHeight: number, targetHeight: number | null) => {
    if (!targetHeight) {
      return currentHeight;
    }

    if (targetHeight > currentHeight) {
      return Math.min(currentHeight + discussionStep, targetHeight);
    }

    return Math.max(initialDiscussionHeight, targetHeight);
  };

  const handleDiscussionTreeChanged = () => {
    setDiscussionSyncVersion((current) => current + 1);
  };

  const handleRepliesVisibilityChanged = (threadElement: HTMLElement | null, isExpanded: boolean) => {
    requestAnimationFrame(() => {
      const content = discussionContentRef.current;
      if (!content || !threadElement) {
        return;
      }

      const expandedReplyBottom = threadElement.offsetTop + threadElement.offsetHeight;
      setDiscussionVisibleHeight((currentVisibleHeight) => {
        if (isExpanded) {
          replyExpansionHeightStackRef.current.push(currentVisibleHeight);

          const missingHeight = expandedReplyBottom + 16 - currentVisibleHeight;
          if (missingHeight <= 0) {
            return currentVisibleHeight;
          }

          return currentVisibleHeight + missingHeight;
        }

        const previousHeight = replyExpansionHeightStackRef.current.pop();
        if (previousHeight === undefined) {
          return Math.max(initialDiscussionHeight, currentVisibleHeight);
        }

        return Math.max(initialDiscussionHeight, previousHeight);
      });
    });
  };

  const handleReplyComposerVisibilityChanged = (threadElement: HTMLElement | null, isReplying: boolean) => {
    setDiscussionViewportOverflow(isReplying ? "auto" : "hidden");
    setHasActiveReplyComposer(isReplying);

    requestAnimationFrame(() => {
      const content = discussionContentRef.current;
      const viewport = discussionViewportRef.current;
      if (!content || !viewport || !threadElement) {
        return;
      }

      setDiscussionVisibleHeight((currentVisibleHeight) => {
        if (!isReplying) {
          const previousHeight = replyComposerHeightStackRef.current.pop();
          if (previousHeight === undefined) {
            return Math.max(initialDiscussionHeight, currentVisibleHeight);
          }

          return Math.max(initialDiscussionHeight, previousHeight);
        }

        const composerElement = threadElement.querySelector<HTMLElement>("[data-comment-composer]");
        if (!composerElement) {
          return currentVisibleHeight;
        }

        replyComposerHeightStackRef.current.push(currentVisibleHeight);

        const commentTop = threadElement.offsetTop;
        const composerBottom = composerElement.offsetTop + composerElement.offsetHeight;
        const extraPadding = 24;
        const requiredVisibleHeight = composerBottom - commentTop + extraPadding * 2;
        const nextVisibleHeight = Math.max(currentVisibleHeight, requiredVisibleHeight);

        return nextVisibleHeight;
      });

      if (!isReplying) {
        viewport.scrollTop = 0;
        return;
      }

      const composerElement = threadElement.querySelector<HTMLElement>("[data-comment-composer]");
      if (!composerElement) {
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const commentRect = threadElement.getBoundingClientRect();
      const composerRect = composerElement.getBoundingClientRect();
      const extraPadding = 24;
      const commentIsAboveViewport = commentRect.top < viewportRect.top + extraPadding;
      const composerIsBelowViewport = composerRect.bottom > viewportRect.bottom - extraPadding;

      if (commentIsAboveViewport || composerIsBelowViewport) {
        viewport.scrollTop = Math.max(0, threadElement.offsetTop - extraPadding);
      }
    });
  };

  useEffect(() => {
    setDiscussionVisibleHeight(initialDiscussionHeight);
    setDiscussionContentHeight(null);
    previousDiscussionContentHeightRef.current = null;
    replyExpansionHeightStackRef.current = [];
    replyComposerHeightStackRef.current = [];
    setDiscussionViewportOverflow("hidden");
  }, [paragraphId, initialDiscussionHeight]);

  useEffect(() => {
    const content = discussionContentRef.current;
    if (!content) {
      return;
    }

    const measureHeight = () => {
      window.requestAnimationFrame(() => {
        const nextDiscussionContentHeight = content.scrollHeight;
        setDiscussionContentHeight(nextDiscussionContentHeight);
        previousDiscussionContentHeightRef.current = nextDiscussionContentHeight;
      });
    };

    measureHeight();

    const resizeObserver = new ResizeObserver(measureHeight);
    resizeObserver.observe(content);

    const mutationObserver = new MutationObserver(measureHeight);
    mutationObserver.observe(content, { childList: true, subtree: true, characterData: true });

    window.addEventListener("resize", measureHeight);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", measureHeight);
    };
  }, [comments, paragraphId, discussionSyncVersion]);

  const canManageComment = (comment: PersistedComment) => {
    return Boolean(
      isAuthenticated &&
        (user?.permissions?.includes("comment:edit") || user?.permissions?.includes("comment:delete") || (user?.name && comment.authorName === user.name)),
    );
  };

  const hasDiscussionOverflow = Boolean(discussionContentHeight && discussionContentHeight > discussionVisibleHeight + 8);
  const isDiscussionFullyExpanded = Boolean(discussionContentHeight && discussionVisibleHeight >= discussionContentHeight - 4);
  const shouldShowDiscussionToggle = Boolean(discussionContentHeight && discussionContentHeight > initialDiscussionHeight + 8);

  const handleDiscussionToggle = () => {
    if (!discussionContentHeight) {
      return;
    }

    if (isDiscussionFullyExpanded) {
      setDiscussionVisibleHeight(initialDiscussionHeight);
      setReplyExpansionResetVersion((current) => current + 1);
      return;
    }

    setDiscussionVisibleHeight((current) => getNextDiscussionHeight(current, discussionContentHeight));
  };

  const mapPersistedCommentToDocumentItem = (comment: PersistedComment, parentAuthor?: string | null): DocumentItem => {
    const isReply = Boolean(parentAuthor);
    return {
      id: comment.id,
      type: isReply ? "reply" : "comment",
      author: comment.authorName,
      text: comment.content,
      originalContent: comment.originalContent ?? null,
      likes: comment.likes,
      likedBy: comment.likedBy,
      replies: comment.replies.map((reply) => mapPersistedCommentToDocumentItem(reply, comment.authorName)),
      replyTo: isReply ? parentAuthor ?? undefined : undefined,
      edited: Boolean(comment.editedAt),
      editedBy: comment.editedBy,
      editorLocked: comment.editorLocked,
      deletedAt: comment.deletedAt ?? undefined,
      deletedBy: comment.deletedBy,
      status: comment.deletedAt ? (comment.deletedBy === "editor" ? "deleted-by-editor" : "deleted") : "approved",
    };
  };

  return (
    <div className="relative mb-6">
      <div
        onMouseEnter={(event) => {
          const nextPosition = { x: event.clientX, y: event.clientY + 18 };
          setTooltipState({ isVisible: true, position: nextPosition });
        }}
        onMouseMove={(event) => {
          setTooltipState((current) => ({
            isVisible: current.isVisible,
            position: { x: event.clientX, y: event.clientY + 18 },
          }));
        }}
        onMouseLeave={() => setTooltipState({ isVisible: false, position: null })}
        onFocus={() => {
          const nextPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
          setTooltipState({ isVisible: true, position: nextPosition });
        }}
        onBlur={() => setTooltipState({ isVisible: false, position: null })}
        className={`cursor-pointer rounded-[1.1rem] border border-white/10 bg-zinc-900 p-4 transition-colors duration-200 sm:p-5 ${
          tooltipState.isVisible ? "bg-white/[0.03]" : ""
        }`}
      >
        <p
          onClick={handleParagraphClick}
          className="relative cursor-pointer text-[1.05rem] leading-8 text-zinc-200 selection:bg-zinc-500/40 sm:text-[1.1rem]"
        >
          {item.text}
        </p>
      </div>

      {tooltipState.isVisible && tooltipState.position ? (
        <div
          className="pointer-events-none fixed z-[45] -translate-x-1/2 rounded-full border border-white/10 bg-zinc-950/90 px-2.5 py-1 text-[0.72rem] font-medium text-zinc-300 shadow-[0_10px_24px_rgba(0,0,0,0.24)] backdrop-blur transition-all duration-200 ease-out translate-y-0 opacity-100 scale-100"
          style={{ left: tooltipState.position.x, top: tooltipState.position.y }}
        >
          <span className="mr-1.5 inline-flex items-center text-zinc-400">
            <BiCommentDetail className="h-3.5 w-3.5" />
          </span>
          Clique para comentar
        </div>
      ) : null}

      {paragraphOfficialComments.length ? <OfficialCommentsList comments={paragraphOfficialComments} /> : null}

      {isLoading ? <p className="mt-3 text-sm text-zinc-500">Carregando comentários…</p> : null}

      {!isLoading && comments.length ? (
        <div className="mt-3 ml-7 max-w-[78%] rounded-[1.1rem] border border-white/10 bg-zinc-950/50 p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-zinc-500">Discussão</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.72rem] font-medium text-zinc-400">
                {totalDiscussionCount} comentários
              </span>
            </div>
          </div>

          <div
            ref={discussionViewportRef}
            className="relative overflow-hidden transition-[max-height] duration-300 ease-out"
            style={{ maxHeight: `${discussionVisibleHeight}px`, overflowY: discussionViewportOverflow }}
            data-discussion-viewport
          >
            <div ref={discussionContentRef} className="space-y-2">
              {comments.map((comment) => {
                const item = mapPersistedCommentToDocumentItem(comment);
                const canManage = canManageComment(comment);

                return (
                  <CommentThread
                    key={comment.id}
                    item={item}
                    compactRootContainer
                    onDiscussionTreeChanged={handleDiscussionTreeChanged}
                    onRepliesVisibilityChanged={handleRepliesVisibilityChanged}
                    onReplyComposerVisibilityChanged={handleReplyComposerVisibilityChanged}
                    resetRepliesExpansionVersion={replyExpansionResetVersion}
                    onToggleLike={(commentId) => void toggleLike(commentId)}
                    onSubmitReply={(content, parentId) => void submitComment(content, parentId)}
                    onSaveEdit={(commentId, content) => void editComment(commentId, content)}
                    onDeleteComment={(commentId) => void deleteComment(commentId)}
                    onModerateComment={(action, commentId) => void moderateComment(action, commentId)}
                    canAct={canAct}
                    isAuthenticated={isAuthenticated}
                    currentUserName={user?.name ?? null}
                    currentUsername={user?.username ?? null}
                    canManage={canManage}
                    isAdminUser={Boolean(isAuthenticated && user?.permissions?.includes("admin:access"))}
                    canEdit={Boolean(isAuthenticated && user?.status === "ACTIVE" && !comment.editorLocked)}
                    isEditorLocked={Boolean(comment.editorLocked)}
                    requestLogin={requestLogin}
                    currentUserDisplayName={user?.name ?? null}
                  />
                );
              })}
            </div>
            {hasDiscussionOverflow && !hasActiveReplyComposer ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-transparent" />
            ) : null}
          </div>

          {shouldShowDiscussionToggle ? (
            <div className="mt-2">
              <button
                type="button"
                onClick={handleDiscussionToggle}
                className="rounded-full border border-white/10 bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.03] active:-translate-y-[1px] active:scale-[0.995] hover:bg-zinc-800 hover:text-zinc-100"
              >
                {isDiscussionFullyExpanded ? "▲ Ocultar respostas" : "▼ Mostrar mais"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {isComposerOpen && composer.position ? (
        <CommentPopup
          x={composer.position.x}
          y={composer.position.y}
          value={composer.value}
          error={composer.error}
          maxLength={MAX_LENGTH}
          authorName={user?.name ?? "Visitante"}
          onChange={updateValue}
          onSubmit={() => void submitComment()}
          onCancel={closeComposer}
        />
      ) : null}

      {notice ? (
        <div className="mt-4 rounded-full border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-300 shadow-sm backdrop-blur">
          {notice}
        </div>
      ) : null}
    </div>
  );
}
