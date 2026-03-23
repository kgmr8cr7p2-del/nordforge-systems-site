import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { applySessionCookie, issueSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectWithMessage } from "@/lib/routes";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("displayName") || "").trim();

  if (!email || !password || password.length < 8) {
    return redirectWithMessage(
      request.url,
      "/register",
      "error",
      "Введите корректный email и пароль не короче 8 символов."
    );
  }

  const existing = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (existing) {
    return redirectWithMessage(request.url, "/register", "error", "Этот email уже занят.");
  }

  const user = await prisma.user.create({
    data: {
      displayName: displayName || null,
      email,
      password: {
        create: {
          passwordHash: await bcrypt.hash(password, 12)
        }
      },
      portfolio: {
        create: {
          name: "Мой портфель"
        }
      }
    }
  });

  const sessionToken = await issueSession(user.id);
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  applySessionCookie(response, sessionToken);
  return response;
}
