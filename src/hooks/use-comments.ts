"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLogin } from "@/hooks/use-login";

type CommentComposerState = {
  paragraphId: string | null;
  position: { x: number; y: number } | null;
  value: string;
  error: string;
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

type ApiComment = {
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
  author: {
    id: string;
    username: string;
    displayName: string;
    role: string;
  };
  likesCount: number;
  likedBy: string[];
  replies: ApiComment[];
};

const MAX_LENGTH = 180;

function buildPersistedComment(comment: ApiComment): PersistedComment {
  return {
    id: comment.id,
    paragraphId: comment.paragraphId,
    parentId: comment.parentId,
    content: comment.content,
    originalContent: comment.originalContent ?? null,
    createdAt: comment.createdAt,
    editedAt: comment.editedAt,
    editedBy: comment.editedBy,
    editorLocked: comment.editorLocked,
    deletedAt: comment.deletedAt,
    deletedBy: comment.deletedBy,
    authorId: comment.author.id,
    authorName: comment.author.displayName,
    likes: comment.likesCount,
    likedBy: comment.likedBy,
    replies: (comment.replies ?? []).map(buildPersistedComment),
  };
}

function insertReplyIntoTree(comments: PersistedComment[], parentId: string, reply: PersistedComment): PersistedComment[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return { ...comment, replies: [...comment.replies, reply] };
    }

    if (comment.replies.length) {
      return { ...comment, replies: insertReplyIntoTree(comment.replies, parentId, reply) };
    }

    return comment;
  });
}

function updateCommentInTree(comments: PersistedComment[], commentId: string, updater: (comment: PersistedComment) => PersistedComment): PersistedComment[] {
  return comments.flatMap((comment) => {
    if (comment.id === commentId) {
      return [updater(comment)];
    }

    if (comment.replies.length) {
      return [{ ...comment, replies: updateCommentInTree(comment.replies, commentId, updater) }];
    }

    return [comment];
  });
}

function removeCommentFromTree(comments: PersistedComment[], commentId: string): PersistedComment[] {
  return comments.flatMap((comment) => {
    if (comment.id === commentId) {
      return comment.replies;
    }

    if (comment.replies.length) {
      return [{ ...comment, replies: removeCommentFromTree(comment.replies, commentId) }];
    }

    return [comment];
  });
}

export function useComments(paragraphId: string | null) {
  const { user, isAuthenticated } = useLogin();
  const canComment = isAuthenticated && user?.status === "ACTIVE";
  const [comments, setComments] = useState<PersistedComment[]>([]);
  const [composer, setComposer] = useState<CommentComposerState>({
    paragraphId: null,
    position: null,
    value: "",
    error: "",
  });
  const [notice, setNotice] = useState("");
  const [loginPrompt, setLoginPrompt] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(""), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!paragraphId) {
      setComments([]);
      return;
    }

    let isActive = true;
    const loadComments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/comments?paragraphId=${encodeURIComponent(paragraphId)}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error ?? "Falha ao carregar comentários.");
        }

        if (!isActive) {
          return;
        }

        const nextComments = Array.isArray(payload.comments) ? payload.comments.map((item: ApiComment) => buildPersistedComment(item)) : [];
        setComments(nextComments);
      } catch {
        if (isActive) {
          setComments([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadComments();

    return () => {
      isActive = false;
    };
  }, [paragraphId, isAuthenticated, user?.status]);

  useEffect(() => {
    if (!isAuthenticated) {
      const timer = window.setTimeout(() => {
        setComments([]);
        setComposer({ paragraphId: null, position: null, value: "", error: "" });
        setLoginPrompt(null);
        setNotice("");
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const openComposer = useCallback((nextParagraphId: string, position: { x: number; y: number }) => {
    if (!canComment) {
      if (!isAuthenticated) {
        setLoginPrompt(position);
      } else {
        setNotice("Sua conta ainda está pendente de aprovação.");
      }
      setComposer({ paragraphId: null, position: null, value: "", error: "" });
      return;
    }

    setComposer({
      paragraphId: nextParagraphId,
      position,
      value: "",
      error: "",
    });
    setLoginPrompt(null);
  }, [canComment, isAuthenticated]);

  const closeComposer = useCallback(() => {
    setComposer({ paragraphId: null, position: null, value: "", error: "" });
    setLoginPrompt(null);
  }, []);

  const updateValue = useCallback((value: string) => {
    setComposer((current) => ({
      ...current,
      value: value.slice(0, MAX_LENGTH),
      error: "",
    }));
  }, []);

  const submitComment = useCallback(async (overrideValue?: string, parentId?: string | null) => {
    const paragraphIdToUse = composer.paragraphId ?? paragraphId;

    if (!paragraphIdToUse) {
      return;
    }

    const trimmedValue = (overrideValue ?? composer.value).trim();

    if (!trimmedValue) {
      setComposer((current) => ({ ...current, error: "Escreva algo antes de enviar." }));
      return;
    }

    if (!canComment) {
      setNotice("Sua conta ainda está pendente de aprovação.");
      return;
    }

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paragraphId: paragraphIdToUse, content: trimmedValue, parentId: parentId ?? null }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível publicar o comentário.");
      }

      const nextComment = buildPersistedComment(payload.comment as ApiComment);
      setComments((current) => {
        if (parentId) {
          return insertReplyIntoTree(current, parentId, nextComment);
        }

        return [nextComment, ...current];
      });
      setNotice(parentId ? "Resposta enviada." : "Comentário enviado.");
      closeComposer();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível publicar o comentário.");
    }
  }, [canComment, closeComposer, composer.value, composer.paragraphId, paragraphId]);

  const toggleLike = useCallback(async (commentId: string) => {
    if (!canComment) {
      setNotice("Sua conta ainda está pendente de aprovação.");
      return;
    }

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-like", commentId }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível atualizar a curtida.");
      }

      const nextComments = Array.isArray(payload.comments)
        ? payload.comments.map((item: ApiComment) => buildPersistedComment(item))
        : [];

      setComments(nextComments);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível atualizar a curtida.");
    }
  }, [canComment]);

  const editComment = useCallback(async (commentId: string, nextContent: string) => {
    const trimmedContent = nextContent.trim();
    if (!trimmedContent) {
      setNotice("Escreva algo antes de salvar.");
      return;
    }

    try {
      const response = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, content: trimmedContent }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível atualizar o comentário.");
      }

      const updatedComment = buildPersistedComment(payload.comment as ApiComment);
      // Preserve replies when updating
      setComments((current) =>
        updateCommentInTree(current, commentId, (existing) => ({ ...existing, ...updatedComment, replies: existing.replies ?? updatedComment.replies }))
      );
      setNotice("Comentário atualizado.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível atualizar o comentário.");
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const response = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, action: "delete" }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível remover o comentário.");
      }

      const deletedComment = buildPersistedComment(payload.comment as ApiComment);
      setComments((current) =>
        updateCommentInTree(current, commentId, (existing) => ({ ...existing, ...deletedComment, replies: existing.replies ?? deletedComment.replies }))
      );
      setNotice("Comentário removido.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível remover o comentário.");
    }
  }, []);

  const moderateComment = useCallback(async (action: string, commentId: string) => {
    try {
      const response = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, action, content: action }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível executar a ação.");
      }

      if (action === "delete-permanently") {
        setComments((current) => removeCommentFromTree(current, commentId));
        setNotice("Comentário removido permanentemente.");
        return;
      }

      const updatedComment = payload.comment ? buildPersistedComment(payload.comment as ApiComment) : null;
      if (!updatedComment) {
        return;
      }

      setComments((current) =>
        updateCommentInTree(current, commentId, (existing) => ({ ...existing, ...updatedComment, replies: existing.replies ?? updatedComment.replies }))
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível executar a ação.");
    }
  }, []);

  const isComposerOpen = useMemo(() => Boolean(composer.position), [composer.position]);

  const focusLogin = useCallback(() => {
    setLoginPrompt(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("documento:focus-login"));
    }
  }, []);

  return {
    comments,
    composer,
    notice,
    loginPrompt,
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
    focusLogin,
  };
}
