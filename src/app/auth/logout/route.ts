import { NextRequest, NextResponse } from "next/server";
import { clearAppSession, clearAppSessionCookie } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const appSessionToken = request.cookies.get("nf_app_session")?.value;
  await clearAppSession(appSessionToken);

  const response = NextResponse.redirect(new URL("/", request.url));
  clearAppSessionCookie(response);
  return response;
}
