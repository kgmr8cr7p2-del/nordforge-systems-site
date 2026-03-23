import { NextRequest, NextResponse } from "next/server";
import { refreshAllPortfolioPrices } from "@/lib/steam";

function isAuthorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return false;
  }

  const bearer = request.headers.get("authorization");
  if (bearer === `Bearer ${expected}`) {
    return true;
  }

  return request.headers.get("x-cron-secret") === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updatedCount = await refreshAllPortfolioPrices();
    return NextResponse.json({ ok: true, updatedCount });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Refresh failed"
      },
      { status: 500 }
    );
  }
}
