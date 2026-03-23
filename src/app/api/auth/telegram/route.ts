import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Telegram-вход требует отдельной настройки bot token и пока отключён."
    },
    { status: 503 }
  );
}
