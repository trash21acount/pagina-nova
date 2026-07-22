import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionCookieOptions, hashPassword, verifyPassword, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    select: { id: true, username: true, displayName: true, passwordHash: true, role: true, status: true },
  });

  if (!user || user.status === "REJECTED" || user.status === "BANNED") {
    return null;
  }

  return user;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === "string" ? body.action : "";

  if (action === "change-name") {
    const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
    if (!displayName) {
      return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { displayName },
      select: { displayName: true },
    });

    return NextResponse.json({ ok: true, user: { name: updatedUser.displayName } });
  }

  if (action === "change-password") {
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword.trim() : "";

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: "Senha atual inválida." }, { status: 401 });
    }

    if (!newPassword) {
      return NextResponse.json({ error: "Nova senha inválida." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(newPassword) },
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "delete-account") {
    const password = typeof body?.password === "string" ? body.password : "";
    const confirmed = body?.confirmed === true;

    if (!confirmed) {
      return NextResponse.json({ error: "Confirmação necessária." }, { status: 400 });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Senha inválida." }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: "[Usuário deletado]",
        passwordHash: hashPassword(`${Date.now()}-${Math.random()}`),
        status: "BANNED",
        registrationReason: null,
      },
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set("auth_session", "", { ...createSessionCookieOptions(), maxAge: 0 });
    return response;
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
