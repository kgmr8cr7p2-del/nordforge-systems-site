import { NextRequest, NextResponse } from "next/server";
import { searchSteamItems } from "@/lib/steam";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";

  if (query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchSteamItems(query);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Не удалось получить подсказки Steam." },
      { status: 500 }
    );
  }
}
