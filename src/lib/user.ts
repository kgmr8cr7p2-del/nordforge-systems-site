import type { Prisma } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

type UserOverrides = {
  displayName?: string | null;
};

function readMetadataString(user: SupabaseUser, keys: string[]) {
  for (const key of keys) {
    const value = user.user_metadata?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export async function ensureAppUser(user: SupabaseUser, overrides: UserOverrides = {}) {
  const email = user.email?.trim().toLowerCase() || null;
  const displayName =
    overrides.displayName?.trim() ||
    readMetadataString(user, ["display_name", "full_name", "name"]);

  const updateData: Prisma.UserUpdateInput = {};

  if (email) {
    updateData.email = email;
  }

  if (displayName) {
    updateData.displayName = displayName;
  }

  return prisma.user.upsert({
    where: {
      id: user.id
    },
    update: updateData,
    create: {
      id: user.id,
      email,
      displayName,
      portfolio: {
        create: {
          name: "Мой портфель"
        }
      }
    }
  });
}
