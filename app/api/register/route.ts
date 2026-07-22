import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (!username || !password || !confirmPassword || !reason) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "As senhas não conferem." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    return NextResponse.json({ error: "Nome de usuário já cadastrado." }, { status: 409 });
  }

  const publicId = `${Date.now().toString().slice(-6)}`;
  const createdUser = await prisma.user.create({
    data: {
      username,
      displayName: username,
      passwordHash: hashPassword(password),
      publicId,
      registrationReason: reason,
      role: "USER",
      status: "PENDING",
    },
  });

  await prisma.adminActionLog.create({
    data: {
      action: "user-created",
      target: createdUser.id,
      details: `username=${createdUser.username}`,
    },
  });

  return NextResponse.json({ ok: true });
}
