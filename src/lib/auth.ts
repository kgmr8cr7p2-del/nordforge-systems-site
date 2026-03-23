import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureAppUser } from "@/lib/user";

const APP_SESSION_COOKIE_NAME = "nf_app_session";
const APP_SESSION_TTL_DAYS = 30;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createAppSessionExpiry() {
  return new Date(Date.now() + APP_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function buildAppSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: createAppSessionExpiry()
  };
}

export async function getSupabaseAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function issueAppSession(userId: string) {
  const token = crypto.randomBytes(48).toString("hex");

  await prisma.appSession.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: createAppSessionExpiry()
    }
  });

  return token;
}

async function findUserByAppSessionToken(sessionToken: string | undefined) {
  if (!sessionToken) {
    return null;
  }

  const session = await prisma.appSession.findFirst({
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

export function applyAppSessionCookie(response: NextResponse, sessionToken: string) {
  response.cookies.set(APP_SESSION_COOKIE_NAME, sessionToken, buildAppSessionCookieOptions());
}

export async function clearAppSession(sessionToken: string | undefined) {
  if (!sessionToken) {
    return;
  }

  await prisma.appSession.deleteMany({
    where: {
      tokenHash: hashToken(sessionToken)
    }
  });
}

export function clearAppSessionCookie(response: NextResponse) {
  response.cookies.set(APP_SESSION_COOKIE_NAME, "", {
    ...buildAppSessionCookieOptions(),
    expires: new Date(0)
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const appSessionToken = cookieStore.get(APP_SESSION_COOKIE_NAME)?.value;
  const appUser = await findUserByAppSessionToken(appSessionToken);

  if (appUser) {
    return appUser;
  }

  const authUser = await getSupabaseAuthUser();

  if (!authUser) {
    return null;
  }

  return ensureAppUser(authUser);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
