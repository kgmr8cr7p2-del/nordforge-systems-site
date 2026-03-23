import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureAppUser } from "@/lib/user";

export async function getSupabaseAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentUser() {
  const authUser = await getSupabaseAuthUser();

  if (!authUser) {
    return null;
  }

  return ensureAppUser(authUser);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
