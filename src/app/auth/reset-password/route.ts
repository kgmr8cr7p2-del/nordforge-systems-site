import { NextRequest } from "next/server";
import { redirectWithMessage } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");

  if (password.length < 8) {
    return redirectWithMessage(
      request.url,
      "/reset-password",
      "error",
      "Пароль должен быть не короче 8 символов."
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectWithMessage(
      request.url,
      "/reset-password",
      "error",
      "Откройте эту страницу по ссылке из письма восстановления."
    );
  }

  const { error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    return redirectWithMessage(
      request.url,
      "/reset-password",
      "error",
      "Не удалось обновить пароль. Повторите попытку."
    );
  }

  return redirectWithMessage(request.url, "/dashboard", "success", "Пароль обновлён.");
}
