import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectWithMessage } from "@/lib/routes";
import { fetchSteamPriceByHashName } from "@/lib/steam";

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return redirectWithMessage(request.url, "/login", "error", "Сначала войдите в аккаунт.");
  }

  const formData = await request.formData();
  const itemName = String(formData.get("itemName") || "").trim();
  const marketHashName = String(formData.get("marketHashName") || "").trim();
  const iconUrl = String(formData.get("iconUrl") || "").trim();
  const quantity = Number.parseInt(String(formData.get("quantity") || "1"), 10);

  if (!itemName || !marketHashName || !Number.isInteger(quantity) || quantity < 1) {
    return redirectWithMessage(
      request.url,
      "/dashboard",
      "error",
      "Выберите предмет из подсказки Steam и укажите корректное количество."
    );
  }

  const pricing = await fetchSteamPriceByHashName(marketHashName);
  if (pricing.currentPriceCents <= 0) {
    return redirectWithMessage(
      request.url,
      "/dashboard",
      "error",
      "Не удалось получить текущую цену предмета из Steam."
    );
  }

  const portfolio = await prisma.portfolio.upsert({
    where: {
      userId: user.id
    },
    update: {},
    create: {
      userId: user.id,
      name: "Мой портфель"
    }
  });

  await prisma.portfolioItem.create({
    data: {
      portfolioId: portfolio.id,
      itemName,
      marketHashName,
      iconUrl: iconUrl || null,
      quantity,
      addedPriceCents: pricing.currentPriceCents,
      currentPriceCents: pricing.currentPriceCents,
      steamNetCents: pricing.steamNetCents,
      payoutCents: pricing.payoutCents,
      priceUpdatedAt: new Date()
    }
  });

  return redirectWithMessage(request.url, "/dashboard", "success", "Предмет добавлен в портфель.");
}
