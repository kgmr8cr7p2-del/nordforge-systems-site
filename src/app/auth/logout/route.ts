import { NextRequest, NextResponse } from "next/server";
import { clearSessionByToken, clearSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get("nf_session")?.value;

  await clearSessionByToken(sessionToken);

  const response = NextResponse.redirect(new URL("/", request.url));
  clearSessionCookie(response);
  return response;
}
