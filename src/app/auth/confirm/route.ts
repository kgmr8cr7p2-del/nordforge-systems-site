import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { redirectWithMessage } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureAppUser } from "@/lib/user";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const requestedType = requestUrl.searchParams.get("type");
  const type = requestedType ? (requestedType as EmailOtpType) : null;
  const next = requestUrl.searchParams.get("next");
  const nextPath = next && next.startsWith("/") ? next : "/dashboard";

  if (!code && (!tokenHash || !type)) {
    return redirectWithMessage(
      request.url,
      "/login",
      "error",
      "Ссылка подтверждения недействительна."
    );
  }

  const supabase = await createSupabaseServerClient();
  let error: Error | null = null;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type
    });
    error = result.error;
  }

  if (error) {
    return redirectWithMessage(
      request.url,
      "/login",
      "error",
      "Не удалось подтвердить ссылку. Запросите новую."
    );
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    await ensureAppUser(user);
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
