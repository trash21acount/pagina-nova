"use client";

import { useEffect, useMemo, useState } from "react";
import { useLogin } from "@/hooks/use-login";
import { MarkdownContent } from "@/components/document/markdown-content";
import { CommentActions } from "@/components/document/comments/comment-actions";
import { CommentHeader } from "@/components/document/comments/comment-header";
import { LikeButton } from "@/components/document/comments/like-button";

type DocumentCommentProps = {
  author: string;
  content: string;
  likes?: number;
  likedBy?: string[];
  status?: "approved";
  isOwnComment?: boolean;
  onDelete?: () => void;
};

export function DocumentComment({
  author,
  content,
  likes = 0,
  likedBy = [],
  status = "approved",
  onDelete,
}: DocumentCommentProps) {
  const { user, isAuthenticated, requestLogin } = useLogin();
  const names = Array.isArray(likedBy) ? likedBy.filter(Boolean) : [];
  const baseCount = Math.max(0, likes ?? 0);
  const [likeState, setLikeState] = useState(() => {
    return {
      liked: Boolean(user?.name && names.includes(user.name)),
      count: baseCount,
      likedBy: names,
    };
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(content);
  const [editDraft, setEditDraft] = useState(content);
  const [isDeleted, setIsDeleted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const canManage = Boolean(isAuthenticated && user?.name && author === user.name);
  const tooltipUsers = useMemo(() => (Array.isArray(likeState.likedBy) ? likeState.likedBy.filter(Boolean) : []), [likeState.likedBy]);
  const isLiked = likeState.liked;
  const likeCount = likeState.count;

  const handleToggleLike = () => {
    if (!isAuthenticated) {
      setNotice("Você precisa estar conectado para curtir este comentário.");
      requestLogin(() => {
        setNotice(null);
        setLikeState((current) => {
          const currentUserName = user?.name ?? "Visitante";
          const nextLiked = !current.liked;
          const nextLikedBy = nextLiked
            ? Array.from(new Set([...names, currentUserName]))
            : names.filter((name) => name !== currentUserName);

          return {
            liked: nextLiked,
            count: nextLiked ? baseCount + 1 : baseCount,
            likedBy: nextLikedBy,
          };
        });
      }, "Você precisa estar conectado para curtir este comentário.");
      return;
    }

    setLikeState((current) => {
      const currentUserName = user?.name ?? "Visitante";
      const nextLiked = !current.liked;
      const nextLikedBy = nextLiked
        ? Array.from(new Set([...names, currentUserName]))
        : names.filter((name) => name !== currentUserName);

      return {
        liked: nextLiked,
        count: nextLiked ? baseCount + 1 : baseCount,
        likedBy: nextLikedBy,
      };
    });
    setNotice(null);
  };

  const handleSaveEdit = () => {
    const trimmed = editDraft.trim();

    if (!trimmed) {
      return;
    }

    setCurrentContent(trimmed);
    setEditDraft(trimmed);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditDraft(currentContent);
    setIsEditing(false);
  };

  const handleDeleteComment = () => {
    if (onDelete) {
      onDelete();
      return;
    }

    setIsDeleted(true);
  };

  if (isDeleted) {
    return null;
  }

  return (
    <div className="relative my-3 py-1 pl-0">
      <div className="ml-4 rounded-2xl px-0 py-1">
        <CommentHeader author={author} />

        {!isEditing ? (
          <div className="mt-2 text-[0.95rem] leading-7 text-zinc-300">
            <MarkdownContent content={currentContent} />
          </div>
        ) : null}

        <div className="mt-3 flex flex-nowrap items-center gap-2">
          <LikeButton likes={likeCount} liked={isLiked} tooltipUsers={tooltipUsers} onToggle={handleToggleLike} />
          <CommentActions
            canManage={canManage}
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onDelete={handleDeleteComment}
          />
        </div>

        {notice ? <div className="mt-2 text-sm text-amber-300">{notice}</div> : null}

        {isEditing ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-900/70 p-3">
            <textarea
              value={editDraft}
              onChange={(event) => setEditDraft(event.target.value)}
              className="min-h-20 w-full resize-none rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={handleCancelEdit} className="rounded-full px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200">
                Cancelar
              </button>
              <button type="button" onClick={handleSaveEdit} className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white">
                Salvar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
