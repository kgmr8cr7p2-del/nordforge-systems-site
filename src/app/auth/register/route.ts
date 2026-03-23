import { NextRequest, NextResponse } from "next/server";
import { redirectWithMessage } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureAppUser } from "@/lib/user";

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

  const supabase = await createSupabaseServerClient();
  const appUrl = process.env.APP_URL || new URL(request.url).origin;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/confirm?next=/dashboard`,
      data: {
        display_name: displayName || undefined
      }
    }
  });

  if (error) {
    const message =
      /already registered/i.test(error.message) ? "Этот email уже занят." : error.message;

    return redirectWithMessage(request.url, "/register", "error", message);
  }

  if (!data.user) {
    return redirectWithMessage(
      request.url,
      "/register",
      "error",
      "Не удалось создать аккаунт. Повторите попытку."
    );
  }

  await ensureAppUser(data.user, {
    displayName: displayName || null
  });

  if (!data.session) {
    return redirectWithMessage(
      request.url,
      "/login",
      "success",
      "Аккаунт создан. Подтвердите email по письму и затем войдите."
    );
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
