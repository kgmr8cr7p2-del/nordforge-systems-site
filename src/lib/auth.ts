import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "nf_session";
const SESSION_DURATION_DAYS = 30;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createSessionExpiry() {
  return new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

export function buildSessionCookieValue() {
  return crypto.randomBytes(48).toString("hex");
}

export function buildSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    expires: createSessionExpiry()
  };
}

export async function issueSession(userId: string) {
  const token = buildSessionCookieValue();

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: createSessionExpiry()
    }
  });

  return token;
}

export async function findUserBySessionToken(sessionToken: string | undefined) {
  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashToken(sessionToken),
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  });

  return session?.user ?? null;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return findUserBySessionToken(sessionToken);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export function applySessionCookie(response: NextResponse, sessionToken: string) {
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, buildSessionCookieOptions());
}

export async function clearSessionByToken(sessionToken: string | undefined) {
  if (!sessionToken) {
    return;
  }

  await prisma.session.deleteMany({
    where: {
      tokenHash: hashToken(sessionToken)
    }
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...buildSessionCookieOptions(),
    expires: new Date(0)
  });
}

export async function getUserFromRequest(request: NextRequest) {
  return findUserBySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export function createResetToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  return {
    rawToken,
    tokenHash,
    expiresAt: new Date(Date.now() + 1000 * 60 * 30)
  };
}

export function hashResetToken(rawToken: string) {
  return hashToken(rawToken);
}
