import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { applySessionCookie, hashResetToken, issueSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectWithMessage } from "@/lib/routes";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");

  if (!token || password.length < 8) {
    return redirectWithMessage(
      request.url,
      `/reset-password?token=${encodeURIComponent(token)}`,
      "error",
      "Нужен валидный токен и пароль не короче 8 символов."
    );
  }

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashResetToken(token),
      usedAt: null,
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (!resetToken) {
    return redirectWithMessage(
      request.url,
      "/reset-password",
      "error",
      "Ссылка восстановления недействительна или уже истекла."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.passwordCredential.upsert({
      where: {
        userId: resetToken.userId
      },
      update: {
        passwordHash
      },
      create: {
        userId: resetToken.userId,
        passwordHash
      }
    }),
    prisma.passwordResetToken.update({
      where: {
        id: resetToken.id
      },
      data: {
        usedAt: new Date()
      }
    })
  ]);

  const sessionToken = await issueSession(resetToken.userId);
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  applySessionCookie(response, sessionToken);
  return response;
}
