import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { applyAppSessionCookie, issueAppSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type TelegramPayload = {
  auth_date: number;
  first_name?: string;
  hash: string;
  id: number;
  last_name?: string;
  photo_url?: string;
  username?: string;
};

function verifyTelegramAuth(payload: TelegramPayload) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error("Telegram auth is not configured.");
  }

  const age = Math.abs(Date.now() / 1000 - Number(payload.auth_date));
  if (age > 60 * 60 * 24) {
    throw new Error("Telegram auth payload is too old.");
  }

  const secret = crypto.createHash("sha256").update(botToken).digest();
  const dataCheckString = Object.entries(payload)
    .filter(([key]) => key !== "hash")
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const expectedHash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  const incoming = Buffer.from(payload.hash, "hex");
  const expected = Buffer.from(expectedHash, "hex");

  if (incoming.length !== expected.length || !crypto.timingSafeEqual(incoming, expected)) {
    throw new Error("Telegram hash is invalid.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as TelegramPayload;
    verifyTelegramAuth(payload);

    const telegramId = String(payload.id);
    const displayName = [payload.first_name, payload.last_name].filter(Boolean).join(" ");

    const user = await prisma.user.upsert({
      where: {
        telegramId
      },
      update: {
        displayName: displayName || payload.username || null,
        telegramUsername: payload.username || null,
        telegramPhotoUrl: payload.photo_url || null
      },
      create: {
        id: `tg_${telegramId}`,
        telegramId,
        displayName: displayName || payload.username || null,
        telegramUsername: payload.username || null,
        telegramPhotoUrl: payload.photo_url || null
      }
    });

    await prisma.portfolio.upsert({
      where: {
        userId: user.id
      },
      update: {},
      create: {
        userId: user.id,
        name: "Мой портфель"
      }
    });

    const sessionToken = await issueAppSession(user.id);
    const response = NextResponse.json({ ok: true });
    applyAppSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Не удалось войти через Telegram."
      },
      { status: 400 }
    );
  }
}
