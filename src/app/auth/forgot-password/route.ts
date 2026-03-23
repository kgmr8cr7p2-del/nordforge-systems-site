import { NextRequest } from "next/server";
import { redirectWithMessage } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    return redirectWithMessage(
      request.url,
      "/forgot-password",
      "error",
      "Введите email для восстановления."
    );
  }

  const supabase = await createSupabaseServerClient();
  const appUrl = process.env.APP_URL || new URL(request.url).origin;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/confirm?next=/reset-password`
  });

  if (error) {
    return redirectWithMessage(
      request.url,
      "/forgot-password",
      "error",
      "Не удалось отправить письмо. Повторите попытку позже."
    );
  }

  return redirectWithMessage(
    request.url,
    "/forgot-password",
    "success",
    "Если такой email существует, ссылка на восстановление уже отправлена."
  );
}
