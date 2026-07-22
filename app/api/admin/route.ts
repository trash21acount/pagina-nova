import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, verifySessionToken } from "@/lib/auth";

async function getCurrentUser() {
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

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return user;
}

async function logAction(actorId: string | null, action: string, target: string, details?: string | null) {
  await prisma.adminActionLog.create({
    data: {
      action,
      target,
      details: details ?? null,
      actorId,
    },
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const [users, comments, requests, logs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        displayName: true,
        status: true,
        role: true,
        registrationReason: true,
        createdAt: true,
        deletedAt: true,
        originalUsername: true,
        originalDisplayName: true,
      },
    }),
    prisma.comment.findMany({
      where: { deletedAt: null, author: { role: { not: "ADMIN" } } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        editedAt: true,
        editorLocked: true,
        deletedAt: true,
        author: { select: { username: true } },
        replies: { select: { id: true } },
        likes: { select: { id: true } },
      },
    }),
    prisma.user.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true, username: true, registrationReason: true, createdAt: true },
    }),
    prisma.adminActionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, action: true, target: true, details: true, createdAt: true, actor: { select: { username: true } } },
    }),
  ]);

  return NextResponse.json({
    users: users.map((item) => ({
      id: item.id,
      username: item.username,
      displayName: item.displayName,
      status: item.status,
      role: item.role,
      registrationReason: item.registrationReason,
      createdAt: item.createdAt.toISOString(),
      deletedAt: item.deletedAt?.toISOString() ?? null,
    })),
    comments: comments.map((item) => ({
      id: item.id,
      author: item.author.username,
      content: item.content,
      repliesCount: item.replies.length,
      likesCount: item.likes.length,
      createdAt: item.createdAt.toISOString(),
      editedAt: item.editedAt?.toISOString() ?? null,
      editorLocked: item.editorLocked,
      deletedAt: item.deletedAt?.toISOString() ?? null,
      status: item.deletedAt ? "removed" : item.editorLocked ? "locked" : "active",
    })),
    requests: requests.map((item) => ({
      id: item.id,
      username: item.username,
      registrationReason: item.registrationReason,
      createdAt: item.createdAt.toISOString(),
    })),
    logs: logs.map((item) => ({
      id: item.id,
      action: item.action,
      target: item.target,
      details: item.details,
      createdAt: item.createdAt.toISOString(),
      actor: item.actor?.username ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === "string" ? body.action : "";

  if (action === "approve" || action === "reject") {
    const userId = typeof body?.userId === "string" ? body.userId : "";
    if (!userId) {
      return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
    }

    const nextStatus = action === "approve" ? "ACTIVE" : "REJECTED";
    await prisma.user.update({
      where: { id: userId },
      data: { status: nextStatus },
    });

    await logAction(user.id, action === "approve" ? "approve-user" : "reject-user", userId, `status=${nextStatus}`);
    return NextResponse.json({ ok: true });
  }

  if (action === "user-edit-name") {
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";

    if (!userId || !displayName) {
      return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { displayName },
    });

    await logAction(user.id, "user-edited-name", userId, displayName);
    return NextResponse.json({ ok: true });
  }

  if (action === "user-edit-password") {
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const password = typeof body?.password === "string" ? body.password.trim() : "";

    if (!userId || !password) {
      return NextResponse.json({ error: "Senha inválida." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashPassword(password) },
    });

    await logAction(user.id, "user-edited-password", userId, "password-updated");
    return NextResponse.json({ ok: true });
  }

  if (action === "user-delete") {
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const adminPassword = typeof body?.adminPassword === "string" ? body.adminPassword : "";
    if (!userId) {
      return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
    }

    if (userId === user.id) {
      return NextResponse.json({ error: "Você não pode excluir sua própria conta." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, displayName: true, status: true, originalUsername: true, originalDisplayName: true } });
    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
    if (!currentUser || !verifyPassword(adminPassword, currentUser.passwordHash)) {
      return NextResponse.json({ error: "Senha do administrador inválida." }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        username: `deleted-${userId}`,
        originalUsername: targetUser.originalUsername ?? targetUser.username,
        displayName: "[Usuário deletado]",
        originalDisplayName: targetUser.originalDisplayName ?? targetUser.displayName,
        status: "BANNED",
        deletedAt: new Date(),
        deletedById: user.id,
        restoredAt: null,
        restoredById: null,
      },
    });

    await logAction(user.id, "user-deleted", userId, "soft-deleted-by-admin");
    return NextResponse.json({ ok: true });
  }

  if (action === "user-restore") {
    const userId = typeof body?.userId === "string" ? body.userId : "";
    if (!userId) {
      return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true, originalUsername: true, originalDisplayName: true, deletedAt: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    if (!targetUser.deletedAt) {
      return NextResponse.json({ error: "Usuário já está ativo." }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        username: targetUser.originalUsername ?? targetUser.username,
        displayName: targetUser.originalDisplayName ?? targetUser.displayName,
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        restoredAt: new Date(),
        restoredById: user.id,
      },
    });

    await logAction(user.id, "user-restored", userId, "restored-by-admin");
    return NextResponse.json({ ok: true });
  }

  if (action === "user-delete-permanently") {
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const adminPassword = typeof body?.adminPassword === "string" ? body.adminPassword : "";
    if (!userId) {
      return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
    }

    if (userId === user.id) {
      return NextResponse.json({ error: "Você não pode excluir sua própria conta." }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
    if (!currentUser || !verifyPassword(adminPassword, currentUser.passwordHash)) {
      return NextResponse.json({ error: "Senha do administrador inválida." }, { status: 401 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.commentLike.deleteMany({ where: { userId } });
      await tx.comment.deleteMany({ where: { authorId: userId } });
      await tx.adminActionLog.deleteMany({ where: { actorId: userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    await logAction(user.id, "user-deleted-permanently", userId, "hard-deleted-by-admin");
    return NextResponse.json({ ok: true });
  }

  if (action === "comment-edit") {
    const commentId = typeof body?.commentId === "string" ? body.commentId : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!commentId || !content) {
      return NextResponse.json({ error: "Comentário inválido." }, { status: 400 });
    }

    // Determine editor identity and target author
    const target = await prisma.comment.findUnique({ where: { id: commentId }, select: { author: { select: { username: true } }, authorId: true } });
    const targetAuthorUsername = (target?.author?.username ?? "").toLowerCase();
    const currentUsername = (user.username ?? "").toLowerCase();
    const isEditorLuiz = currentUsername === "luiz";
    const isAuthorLuiz = targetAuthorUsername === "luiz";

    if (isEditorLuiz && !isAuthorLuiz) {
      const newContent = `${content}\n\n[Editado pelo editor]`;
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: newContent,
          editedAt: new Date(),
          editedById: user.id,
          editorLocked: true,
        },
      });
      await logAction(user.id, "comment-edited-by-editor", commentId, content);
      return NextResponse.json({ ok: true });
    }

    // Non-editor admins or Luiz editing own comment: normal edit, no editor markers/lock
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        editedAt: new Date(),
        editedById: user.id,
      },
    });

    await logAction(user.id, "comment-edited", commentId, content);
    return NextResponse.json({ ok: true });
  }

  if (action === "comment-delete") {
    const commentId = typeof body?.commentId === "string" ? body.commentId : "";
    if (!commentId) {
      return NextResponse.json({ error: "Comentário inválido." }, { status: 400 });
    }

    const target = await prisma.comment.findUnique({ where: { id: commentId }, select: { author: { select: { username: true } }, authorId: true } });
    const targetAuthorUsername = (target?.author?.username ?? "").toLowerCase();
    const currentUsername = (user.username ?? "").toLowerCase();
    const isEditorLuiz = currentUsername === "luiz";
    const isAuthorLuiz = targetAuthorUsername === "luiz";

    if (isEditorLuiz && !isAuthorLuiz) {
      const removedContent = "Comentário removido pelo editor";
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: removedContent,
          deletedAt: new Date(),
          deletedById: user.id,
          editorLocked: true,
        },
      });
      await logAction(user.id, "comment-removed-by-editor", commentId, "removed-by-admin");
      return NextResponse.json({ ok: true });
    }

    // Non-editor admin or Luiz removing own comment: soft-delete without editor marker/lock
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    });
    await logAction(user.id, "comment-removed", commentId, "removed-by-admin");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
