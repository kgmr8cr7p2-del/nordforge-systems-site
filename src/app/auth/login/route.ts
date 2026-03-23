import { NextRequest, NextResponse } from "next/server";
import { redirectWithMessage } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureAppUser } from "@/lib/user";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return redirectWithMessage(request.url, "/login", "error", "Введите email и пароль.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.user) {
    const message = /invalid login credentials/i.test(error?.message || "")
      ? "Неверный email или пароль."
      : error?.message || "Не удалось войти в аккаунт.";
    return redirectWithMessage(request.url, "/login", "error", message);
  }

  await ensureAppUser(data.user);

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
