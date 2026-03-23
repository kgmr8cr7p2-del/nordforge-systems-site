import { calculateCashout, calculateSteamNet, parsePriceToCents } from "@/lib/money";

const STEAM_APP_ID = process.env.STEAM_APP_ID || "730";
const STEAM_CURRENCY = process.env.STEAM_CURRENCY || "1";
const STEAM_COUNTRY = process.env.STEAM_COUNTRY || "US";

export type SteamSearchResult = {
  itemName: string;
  marketHashName: string;
  iconUrl: string | null;
  currentPriceCents: number;
  steamNetCents: number;
  payoutCents: number;
  priceText: string;
};

function getRequestHeaders() {
  return {
    "User-Agent": "Mozilla/5.0 (compatible; NORDFORGE-Portfolio/1.0; +https://github.com/)",
    Accept: "application/json"
  };
}

function buildSteamSearchUrl(query: string) {
  const url = new URL("https://steamcommunity.com/market/search/render/");
  url.searchParams.set("appid", STEAM_APP_ID);
  url.searchParams.set("norender", "1");
  url.searchParams.set("query", query);
  url.searchParams.set("count", "10");
  url.searchParams.set("start", "0");
  url.searchParams.set("search_descriptions", "0");
  url.searchParams.set("sort_column", "popular");
  url.searchParams.set("sort_dir", "desc");

  return url;
}

function buildFallbackQueries(query: string) {
  const trimmed = query.trim();
  const normalized = trimmed.replace(/[|()[\]]/g, " ").replace(/\s+/g, " ").trim();
  const withoutWear = normalized
    .replace(/\b(Field-Tested|Factory New|Minimal Wear|Well-Worn|Battle-Scarred)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return Array.from(new Set([trimmed, normalized, withoutWear])).filter((candidate) => candidate.length >= 2);
}

async function requestSteamSearch(query: string) {
  const url = buildSteamSearchUrl(query);

  const response = await fetch(url, {
    headers: getRequestHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Steam search failed");
  }

  const payload = await response.json();
  return Array.isArray(payload.results) ? payload.results : [];
}

export async function searchSteamItems(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  let results: Array<Record<string, unknown>> = [];

  for (const candidate of buildFallbackQueries(trimmed)) {
    results = await requestSteamSearch(candidate);
    if (results.length > 0) {
      break;
    }
  }

  return results.map((item: Record<string, unknown>) => {
    const priceText =
      typeof item.sell_price_text === "string" && item.sell_price_text
        ? item.sell_price_text
        : typeof item.sale_price_text === "string"
          ? item.sale_price_text
          : "";

    const currentPriceCents =
      typeof item.sell_price === "number" ? item.sell_price : parsePriceToCents(priceText);

    const assetDescription =
      item.asset_description && typeof item.asset_description === "object"
        ? (item.asset_description as Record<string, unknown>)
        : null;

    const iconPath =
      assetDescription && typeof assetDescription.icon_url === "string"
        ? assetDescription.icon_url
        : null;

    return {
      itemName: String(item.name || item.hash_name || ""),
      marketHashName: String(item.hash_name || item.name || ""),
      iconUrl: iconPath ? `https://community.cloudflare.steamstatic.com/economy/image/${iconPath}/96fx96f` : null,
      currentPriceCents,
      steamNetCents: calculateSteamNet(currentPriceCents),
      payoutCents: calculateCashout(currentPriceCents),
      priceText: priceText || `$${(currentPriceCents / 100).toFixed(2)}`
    } satisfies SteamSearchResult;
  });
}

export async function fetchSteamPriceByHashName(marketHashName: string) {
  const url = new URL("https://steamcommunity.com/market/priceoverview/");
  url.searchParams.set("appid", STEAM_APP_ID);
  url.searchParams.set("currency", STEAM_CURRENCY);
  url.searchParams.set("country", STEAM_COUNTRY);
  url.searchParams.set("market_hash_name", marketHashName);

  const response = await fetch(url, {
    headers: getRequestHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Steam price request failed");
  }

  const payload = await response.json();
  const priceSource =
    (typeof payload.lowest_price === "string" && payload.lowest_price) ||
    (typeof payload.median_price === "string" && payload.median_price) ||
    "";

  const currentPriceCents = parsePriceToCents(priceSource);

  return {
    currentPriceCents,
    steamNetCents: calculateSteamNet(currentPriceCents),
    payoutCents: calculateCashout(currentPriceCents),
    priceText: priceSource || `$${(currentPriceCents / 100).toFixed(2)}`
  };
}

export async function refreshAllPortfolioPrices() {
  const { prisma } = await import("@/lib/prisma");
  const items = await prisma.portfolioItem.findMany({
    select: {
      marketHashName: true
    },
    distinct: ["marketHashName"]
  });

  const updated: string[] = [];

  for (const item of items) {
    const pricing = await fetchSteamPriceByHashName(item.marketHashName);

    await prisma.portfolioItem.updateMany({
      where: {
        marketHashName: item.marketHashName
      },
      data: {
        currentPriceCents: pricing.currentPriceCents,
        steamNetCents: pricing.steamNetCents,
        payoutCents: pricing.payoutCents,
        priceUpdatedAt: new Date()
      }
    });

    updated.push(item.marketHashName);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return updated.length;
}
