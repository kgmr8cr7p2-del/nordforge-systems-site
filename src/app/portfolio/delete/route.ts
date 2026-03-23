import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectWithMessage } from "@/lib/routes";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return redirectWithMessage(request.url, "/login", "error", "Сначала войдите в аккаунт.");
  }

  const formData = await request.formData();
  const itemId = String(formData.get("itemId") || "");

  const item = await prisma.portfolioItem.findFirst({
    where: {
      id: itemId,
      portfolio: {
        userId: user.id
      }
    }
  });

  if (!item) {
    return redirectWithMessage(request.url, "/dashboard", "error", "Товар не найден.");
  }

  await prisma.portfolioItem.delete({
    where: {
      id: item.id
    }
  });

  return redirectWithMessage(request.url, "/dashboard", "success", "Товар удалён из портфеля.");
}
