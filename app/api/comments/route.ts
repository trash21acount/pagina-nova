import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  role: "USER" | "ADMIN";
  status: "PENDING" | "ACTIVE" | "REJECTED" | "BANNED";
};

async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("auth_session")?.value;

  if (!sessionToken) {
    return null;
  }

  const payload = verifySessionToken(sessionToken);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { username: payload.username },
    select: { id: true, username: true, displayName: true, role: true, status: true },
  });

  if (!user || user.status === "REJECTED" || user.status === "BANNED") {
    return null;
  }

  return user;
}

function serializeComment(comment: any) {
  const authorUsername = (comment.author?.username ?? "").toLowerCase();
  const editedByUsername = (comment.editedBy?.username ?? "").toLowerCase();
  const deletedByUsername = (comment.deletedBy?.username ?? "").toLowerCase();

  const editedByFlag = comment.editorLocked && editedByUsername === "luiz" && authorUsername !== "luiz" ? "editor" : undefined;
  const deletedByFlag = comment.editorLocked && deletedByUsername === "luiz" && authorUsername !== "luiz" ? "editor" : undefined;

  return {
    id: comment.id,
    paragraphId: comment.paragraphId,
    parentId: comment.parentId,
    content: comment.content,
    originalContent: comment.originalContent ?? null,
    createdAt: comment.createdAt.toISOString(),
    editedAt: comment.editedAt?.toISOString() ?? null,
    editedBy: editedByFlag,
    editorLocked: comment.editorLocked,
    deletedAt: comment.deletedAt?.toISOString() ?? null,
    deletedBy: deletedByFlag,
    author: {
      id: comment.author.id,
      username: comment.author.username,
      displayName: comment.author.displayName,
      role: comment.author.role,
    },
    likesCount: comment.likes.length,
    likedBy: comment.likes.map((entry: any) => entry.user.displayName),
    replies: [],
  };
}

function buildCommentTree(items: any[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const roots: any[] = [];

  for (const item of items) {
    const node = byId.get(item.id);
    if (!node) {
      continue;
    }

    if (item.parentId) {
      const parent = byId.get(item.parentId);
      if (parent) {
        parent.replies.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const paragraphId = searchParams.get("paragraphId")?.trim();

  if (!paragraphId) {
    return NextResponse.json({ error: "Parágrafo inválido." }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { paragraphId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      paragraphId: true,
      parentId: true,
      content: true,
      originalContent: true,
      createdAt: true,
      editedAt: true,
      editorLocked: true,
      deletedAt: true,
      author: { select: { id: true, username: true, displayName: true, role: true } },
      editedBy: { select: { username: true } },
      deletedBy: { select: { username: true } },
      likes: { select: { user: { select: { displayName: true } } } },
    },
  });

  const serialized = comments.map(serializeComment);
  const tree = buildCommentTree(serialized);

  return NextResponse.json({
    user: user
      ? {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          status: user.status,
        }
      : null,
    comments: tree,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  let body: any = null;
  try {
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Você precisa estar autenticado para comentar." }, { status: 401 });
    }

    body = await request.json().catch(() => ({}));
    const paragraphId = typeof body?.paragraphId === "string" ? body.paragraphId.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const parentId = typeof body?.parentId === "string" ? body.parentId.trim() : null;
    const action = typeof body?.action === "string" ? body.action : null;

    if (action === "toggle-like") {
      const commentId = typeof body?.commentId === "string" ? body.commentId.trim() : "";
      console.log("[like-debug] incoming like request", {
        action,
        commentId,
        authenticatedUser: user
          ? { id: user.id, username: user.username, role: user.role, status: user.status }
          : null,
      });

      if (!commentId) {
        return NextResponse.json({ error: "Comentário inválido." }, { status: 400 });
      }

      const targetComment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { paragraphId: true },
      });

      console.log("[like-debug] target comment lookup", {
        action,
        commentId,
        targetComment,
      });

      if (!targetComment) {
        return NextResponse.json({ error: "Comentário não encontrado." }, { status: 404 });
      }

      const existingLike = await prisma.commentLike.findUnique({
        where: { userId_commentId: { userId: user.id, commentId } },
      });

      console.log("[like-debug] existing like lookup", {
        action,
        commentId,
        existingLike: existingLike ? { id: existingLike.id } : null,
      });

      if (existingLike) {
        await prisma.commentLike.delete({ where: { id: existingLike.id } });
      } else {
        await prisma.commentLike.create({ data: { userId: user.id, commentId } });
      }

      console.log("[like-debug] like mutation completed", {
        action,
        commentId,
        userId: user.id,
      });

      const updatedComment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: {
          id: true,
          paragraphId: true,
          parentId: true,
          content: true,
          originalContent: true,
          createdAt: true,
          editedAt: true,
          editorLocked: true,
          deletedAt: true,
          author: { select: { id: true, username: true, displayName: true, role: true } },
          editedBy: { select: { username: true } },
          deletedBy: { select: { username: true } },
          likes: { select: { user: { select: { displayName: true } } } },
        },
      });

      if (!updatedComment) {
        return NextResponse.json({ error: "Comentário não encontrado." }, { status: 404 });
      }

      // To keep client-side tree stable, return the updated comment node including nested replies.
      const allComments = await prisma.comment.findMany({ where: { paragraphId: targetComment.paragraphId }, select: {
        id: true,
        paragraphId: true,
        parentId: true,
        content: true,
        originalContent: true,
        createdAt: true,
        editedAt: true,
        editorLocked: true,
        deletedAt: true,
        author: { select: { id: true, username: true, displayName: true, role: true } },
        editedBy: { select: { username: true } },
        deletedBy: { select: { username: true } },
        likes: { select: { user: { select: { displayName: true } } } },
      }});

      const serialized = allComments.map(serializeComment);
      const tree = buildCommentTree(serialized);
      return NextResponse.json({ comments: tree, liked: !existingLike });
    }

    if (!paragraphId || !content) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId }, select: { id: true, paragraphId: true } });
      if (!parentComment || parentComment.paragraphId !== paragraphId) {
        return NextResponse.json({ error: "Resposta inválida." }, { status: 400 });
      }
    }

    const createdComment = await prisma.comment.create({
      data: {
        paragraphId,
        content,
        authorId: user.id,
        parentId,
      },
      select: {
        id: true,
        paragraphId: true,
        parentId: true,
        content: true,
        createdAt: true,
        editedAt: true,
        editorLocked: true,
        deletedAt: true,
        author: { select: { id: true, username: true, displayName: true, role: true } },
        editedBy: { select: { username: true } },
        deletedBy: { select: { username: true } },
        likes: { select: { user: { select: { displayName: true } } } },
      },
    });

    return NextResponse.json({ comment: serializeComment(createdComment) });
  } catch (err: any) {
    try {
      const stackLines = (err?.stack ?? "").split("\n").filter(Boolean);
      console.error("[like-debug] like route exception", {
        message: err?.message ?? String(err),
        stack: stackLines,
        fileLine: stackLines[0] ?? null,
        action: typeof body?.action === "string" ? body.action : null,
        commentId: typeof body?.commentId === "string" ? body.commentId.trim() : null,
        authenticatedUser: user
          ? { id: user.id, username: user.username, role: user.role, status: user.status }
          : null,
      });
    } catch (loggingErr) {
      console.error("Failed to log error for POST /api/comments", loggingErr);
    }
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Você precisa estar autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const commentId = typeof body?.commentId === "string" ? body.commentId.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const action = typeof body?.action === "string" ? body.action : null;
  const isAdmin = user.role === "ADMIN";

  if (!commentId) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (action === "delete") {
    // Delete requests are accepted without content.
  } else if (!content) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true, content: true, originalContent: true, deletedAt: true, editorLocked: true },
  });

  if (!existingComment) {
    return NextResponse.json({ error: "Comentário não encontrado." }, { status: 404 });
  }

  if (action === "restore") {
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const restoredContent = existingComment.originalContent ?? existingComment.content;
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: restoredContent,
        originalContent: restoredContent,
        deletedAt: null,
        deletedById: null,
      },
      select: {
        id: true,
        paragraphId: true,
        parentId: true,
        content: true,
        originalContent: true,
        createdAt: true,
        editedAt: true,
        editorLocked: true,
        deletedAt: true,
        author: { select: { id: true, username: true, displayName: true, role: true } },
        editedBy: { select: { username: true } },
        deletedBy: { select: { username: true } },
        likes: { select: { user: { select: { displayName: true } } } },
      },
    });

    return NextResponse.json({ comment: serializeComment(updatedComment) });
  }

  if (action === "unlock") {
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        editorLocked: false,
      },
      select: {
        id: true,
        paragraphId: true,
        parentId: true,
        content: true,
        originalContent: true,
        createdAt: true,
        editedAt: true,
        editorLocked: true,
        deletedAt: true,
        author: { select: { id: true, username: true, displayName: true, role: true } },
        editedBy: { select: { username: true } },
        deletedBy: { select: { username: true } },
        likes: { select: { user: { select: { displayName: true } } } },
      },
    });

    return NextResponse.json({ comment: serializeComment(updatedComment) });
  }

  if (action === "restore-original") {
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const restoredContent = existingComment.originalContent ?? existingComment.content;
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: restoredContent,
        editedAt: null,
        editedById: null,
      },
      select: {
        id: true,
        paragraphId: true,
        parentId: true,
        content: true,
        originalContent: true,
        createdAt: true,
        editedAt: true,
        editorLocked: true,
        deletedAt: true,
        author: { select: { id: true, username: true, displayName: true, role: true } },
        editedBy: { select: { username: true } },
        deletedBy: { select: { username: true } },
        likes: { select: { user: { select: { displayName: true } } } },
      },
    });

    return NextResponse.json({ comment: serializeComment(updatedComment) });
  }

  if (action === "delete") {
    if (existingComment.deletedAt) {
      return NextResponse.json({ error: "Este comentário já foi removido." }, { status: 409 });
    }

    if (existingComment.authorId !== user.id && user.username.toLowerCase() !== "luiz") {
      return NextResponse.json({ error: "Você não pode editar este comentário." }, { status: 403 });
    }
    const updateData: any = {
      originalContent: existingComment.originalContent ?? existingComment.content,
      deletedAt: new Date(),
      deletedById: user.id,
    };

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: updateData,
      select: {
        id: true,
        paragraphId: true,
        parentId: true,
        content: true,
        originalContent: true,
        createdAt: true,
        editedAt: true,
        editorLocked: true,
        deletedAt: true,
        author: { select: { id: true, username: true, displayName: true, role: true } },
        editedBy: { select: { username: true } },
        deletedBy: { select: { username: true } },
        likes: { select: { user: { select: { displayName: true } } } },
      },
    });

    // Return updated node including nested replies
    const allComments = await prisma.comment.findMany({ where: { paragraphId: updatedComment.paragraphId }, select: {
      id: true,
      paragraphId: true,
      parentId: true,
      content: true,
      createdAt: true,
      editedAt: true,
      editorLocked: true,
      deletedAt: true,
      author: { select: { id: true, username: true, displayName: true, role: true } },
      editedBy: { select: { username: true } },
      deletedBy: { select: { username: true } },
      likes: { select: { user: { select: { displayName: true } } } },
    }});

    const serialized = allComments.map(serializeComment);
    const tree = buildCommentTree(serialized);

    const updatedCommentId = updatedComment?.id;
    function findNode(list: any[]): any | null {
      for (const n of list) {
        if (updatedCommentId && n.id === updatedCommentId) return n;
        const found = findNode(n.replies || []);
        if (found) return found;
      }
      return null;
    }

    const node = findNode(tree);
    return NextResponse.json({ comment: node ?? serializeComment(updatedComment) });
  }

  if (action === "delete-permanently") {
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      const target = await tx.comment.findUnique({ where: { id: commentId }, select: { id: true, parentId: true } });
      if (!target) {
        return;
      }

      await tx.commentLike.deleteMany({ where: { commentId } });
      await tx.comment.updateMany({ where: { parentId: commentId }, data: { parentId: target.parentId } });
      await tx.comment.delete({ where: { id: commentId } });
    });

    return NextResponse.json({ ok: true });
  }

  if (existingComment.editorLocked) {
    return NextResponse.json({ error: "Edição bloqueada pelo editor." }, { status: 409 });
  }

  const updateData: any = {
    content,
    editedAt: new Date(),
    editedById: user.id,
    originalContent: existingComment.originalContent ?? existingComment.content,
  };

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: updateData,
    select: {
      id: true,
      paragraphId: true,
      parentId: true,
      content: true,
      originalContent: true,
      createdAt: true,
      editedAt: true,
      editorLocked: true,
      deletedAt: true,
      author: { select: { id: true, username: true, displayName: true, role: true } },
      editedBy: { select: { username: true } },
      deletedBy: { select: { username: true } },
      likes: { select: { user: { select: { displayName: true } } } },
    },
  });

  // Return updated node including nested replies
  const allComments = await prisma.comment.findMany({ where: { paragraphId: updatedComment.paragraphId }, select: {
    id: true,
    paragraphId: true,
    parentId: true,
    content: true,
    createdAt: true,
    editedAt: true,
    editorLocked: true,
    deletedAt: true,
    author: { select: { id: true, username: true, displayName: true, role: true } },
    editedBy: { select: { username: true } },
    deletedBy: { select: { username: true } },
    likes: { select: { user: { select: { displayName: true } } } },
  }});

  const serialized = allComments.map(serializeComment);
  const tree = buildCommentTree(serialized);
  const updatedCommentId = updatedComment?.id;

  function findNode(list: any[]): any | null {
      for (const n of list) {
        if (updatedCommentId && n.id === updatedCommentId) return n;
        const found = findNode(n.replies || []);
        if (found) return found;
      }
      return null;
    }

  const node = findNode(tree);
  return NextResponse.json({ comment: node ?? (updatedComment ? serializeComment(updatedComment) : null) });
}
