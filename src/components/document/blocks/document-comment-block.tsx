"use client";

import { useCallback, useMemo } from "react";
import { CommentThread } from "@/components/document/comments/comment-thread";
import { useComments } from "@/hooks/use-comments";
import { useLogin } from "@/hooks/use-login";
import type { DocumentItem } from "@/types/document";

type PersistedCommentViewModel = {
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
  replies: PersistedCommentViewModel[];
};

type DocumentCommentBlockProps = {
  blockId: string;
  item: DocumentItem;
};

function mapPersistedCommentToDocumentItem(comment: PersistedCommentViewModel, parentAuthor?: string | null): DocumentItem {
  const isReply = Boolean(parentAuthor);
  return {
    id: comment.id,
    type: isReply ? "reply" : "comment",
    author: comment.authorName,
    text: comment.content,
    originalContent: comment.originalContent ?? null,
    likes: comment.likes,
    likedBy: comment.likedBy,
    replies: comment.replies.map((c) => mapPersistedCommentToDocumentItem(c, comment.authorName)),
    replyTo: isReply ? parentAuthor ?? undefined : undefined,
    edited: Boolean(comment.editedAt),
    editedBy: comment.editedBy,
    editorLocked: comment.editorLocked,
    deletedAt: comment.deletedAt ?? undefined,
    deletedBy: comment.deletedBy ?? undefined,
    status: comment.deletedAt ? (comment.deletedBy === "editor" ? "deleted-by-editor" : "deleted") : "approved",
  };
}

export function DocumentCommentBlock({ blockId, item }: DocumentCommentBlockProps) {
  const paragraphId = `${blockId}-${item.id}`;
  const { comments, submitComment, toggleLike, editComment, deleteComment, moderateComment } = useComments(paragraphId);
  const { user, isAuthenticated, requestLogin } = useLogin();

  const findCommentById = useCallback((nodes: PersistedCommentViewModel[], targetId: string): PersistedCommentViewModel | null => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node;
      }

      const nested = findCommentById(node.replies, targetId);
      if (nested) {
        return nested;
      }
    }

    return null;
  }, []);

  const resolvedItem = useMemo(() => {
    const matched = findCommentById(comments, item.id);
    return matched ? mapPersistedCommentToDocumentItem(matched) : item;
  }, [comments, findCommentById, item]);

  const handleToggleLike = useCallback((commentId: string) => {
    void toggleLike(commentId);
  }, [toggleLike]);

  const handleSubmitReply = useCallback(async (content: string, parentId: string) => {
    await submitComment(content, parentId);
  }, [submitComment]);

  const handleSaveEdit = useCallback(async (commentId: string, content: string) => {
    await editComment(commentId, content);
  }, [editComment]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    await deleteComment(commentId);
  }, [deleteComment]);

  return (
    <CommentThread
      item={resolvedItem}
      onToggleLike={(commentId) => void toggleLike(commentId)}
      onSubmitReply={handleSubmitReply}
      onSaveEdit={handleSaveEdit}
      onDeleteComment={handleDeleteComment}
      onModerateComment={(action, commentId) => void moderateComment(action, commentId)}
      canAct={Boolean(isAuthenticated && user?.status === "ACTIVE")}
      isAuthenticated={isAuthenticated}
      currentUserName={user?.name ?? null}
      currentUsername={user?.username ?? null}
      canManage={Boolean(
        isAuthenticated &&
          (user?.permissions?.includes("comment:edit") || user?.permissions?.includes("comment:delete") || (user?.name && resolvedItem.author === user.name)),
      )}
      isAdminUser={Boolean(isAuthenticated && user?.permissions?.includes("admin:access"))}
      canEdit={Boolean(isAuthenticated && user?.status === "ACTIVE" && !resolvedItem.editorLocked)}
      isEditorLocked={Boolean(resolvedItem.editorLocked)}
      requestLogin={requestLogin}
      currentUserDisplayName={user?.name ?? null}
    />
  );
}
