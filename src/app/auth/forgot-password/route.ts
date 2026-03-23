import { NextRequest } from "next/server";
import { createResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { redirectWithMessage } from "@/lib/routes";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    return redirectWithMessage(
      request.url,
      "/forgot-password",
      "error",
      "Введите email для восстановления."
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (user) {
    const token = createResetToken();

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null
      }
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt
      }
    });

    const appUrl = process.env.APP_URL || new URL(request.url).origin;
    const resetUrl = `${appUrl}/reset-password?token=${token.rawToken}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  return redirectWithMessage(
    request.url,
    "/forgot-password",
    "success",
    "Если такой email существует, ссылка на восстановление уже отправлена."
  );
}
