import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionCookieOptions, createSessionToken, verifyPassword, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("auth_session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const payload = verifySessionToken(sessionToken);
  if (!payload) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { username: payload.username },
    select: { username: true, displayName: true, role: true, status: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 401 });
  }

  if (user.status === "REJECTED" || user.status === "BANNED") {
    return NextResponse.json({ error: "Usuário não autorizado." }, { status: 403 });
  }

  return NextResponse.json({
    user: {
      name: user.displayName,
      username: user.username,
      avatar: null,
      permissions: user.role === "ADMIN" ? ["comment:edit", "comment:delete", "admin:access"] : [],
      status: user.status,
      role: user.role,
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Informe usuário e senha." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, displayName: true, passwordHash: true, role: true, status: true },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  if (user.status === "REJECTED" || user.status === "BANNED") {
    return NextResponse.json({ error: "Sua conta não está autorizada para entrar." }, { status: 403 });
  }

  const sessionToken = createSessionToken({ sub: user.id, username: user.username, role: user.role });
  const response = NextResponse.json({
    user: {
      name: user.displayName,
      username: user.username,
      avatar: null,
      permissions: user.role === "ADMIN" ? ["comment:edit", "comment:delete", "admin:access"] : [],
      status: user.status,
      role: user.role,
    },
  });

  response.cookies.set("auth_session", sessionToken, createSessionCookieOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth_session", "", { ...createSessionCookieOptions(), maxAge: 0 });
  return response;
}
