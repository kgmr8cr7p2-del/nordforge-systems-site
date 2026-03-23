import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { applySessionCookie, issueSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectWithMessage } from "@/lib/routes";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return redirectWithMessage(request.url, "/login", "error", "Введите email и пароль.");
  }

  const user = await prisma.user.findUnique({
    where: {
      email
    },
    include: {
      password: true
    }
  });

  if (!user?.password) {
    return redirectWithMessage(request.url, "/login", "error", "Аккаунт не найден.");
  }

  const isValid = await bcrypt.compare(password, user.password.passwordHash);
  if (!isValid) {
    return redirectWithMessage(request.url, "/login", "error", "Неверный пароль.");
  }

  const sessionToken = await issueSession(user.id);
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  applySessionCookie(response, sessionToken);
  return response;
}
