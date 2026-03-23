import { formatUsd } from "@/lib/money";

export type DashboardView = "portfolio" | "chart";
export type ChartRange = "1d" | "3d" | "7d" | "30d" | "all";

type PortfolioItemLike = {
  id: string;
  itemName: string;
  marketHashName: string;
  iconUrl: string | null;
  quantity: number;
  addedPriceCents: number;
  currentPriceCents: number;
  steamNetCents: number;
  payoutCents: number;
  createdAt: Date;
  priceUpdatedAt: Date;
};

type MarketPriceHistoryLike = {
  marketHashName: string;
  currentPriceCents: number;
  capturedAt: Date;
};

export type PortfolioGroup = {
  marketHashName: string;
  itemName: string;
  iconUrl: string | null;
  items: PortfolioItemLike[];
  totalQuantity: number;
  totalAdded: number;
  totalCurrent: number;
  totalSteamNet: number;
  totalPayout: number;
  lastAddedAt: Date;
};

export type PortfolioChartPoint = {
  timestamp: Date;
  totalValueCents: number;
};

export const chartRanges: Array<{ key: ChartRange; label: string }> = [
  { key: "1d", label: "1 день" },
  { key: "3d", label: "3 дня" },
  { key: "7d", label: "7 дней" },
  { key: "30d", label: "30 дней" },
  { key: "all", label: "Все время" }
];

export function resolveDashboardView(value: string | undefined): DashboardView {
  return value === "chart" ? "chart" : "portfolio";
}

export function resolveChartRange(value: string | undefined): ChartRange {
  if (value === "1d" || value === "3d" || value === "7d" || value === "30d" || value === "all") {
    return value;
  }

  return "7d";
}

export function sumPortfolio(
  items: Array<Pick<PortfolioItemLike, "quantity" | "addedPriceCents" | "currentPriceCents" | "steamNetCents" | "payoutCents">>
) {
  return items.reduce(
    (acc, item) => {
      acc.added += item.addedPriceCents * item.quantity;
      acc.current += item.currentPriceCents * item.quantity;
      acc.steamNet += item.steamNetCents * item.quantity;
      acc.payout += item.payoutCents * item.quantity;
      acc.count += item.quantity;
      return acc;
    },
    { added: 0, current: 0, steamNet: 0, payout: 0, count: 0 }
  );
}

export function groupPortfolioItems(items: PortfolioItemLike[]) {
  return Array.from(
    items.reduce((map, item) => {
      const current = map.get(item.marketHashName) ?? {
        marketHashName: item.marketHashName,
        itemName: item.itemName,
        iconUrl: item.iconUrl,
        items: [] as PortfolioItemLike[],
        totalQuantity: 0,
        totalAdded: 0,
        totalCurrent: 0,
        totalSteamNet: 0,
        totalPayout: 0,
        lastAddedAt: item.createdAt
      };

      current.items.push(item);
      current.iconUrl = current.iconUrl || item.iconUrl;
      current.totalQuantity += item.quantity;
      current.totalAdded += item.addedPriceCents * item.quantity;
      current.totalCurrent += item.currentPriceCents * item.quantity;
      current.totalSteamNet += item.steamNetCents * item.quantity;
      current.totalPayout += item.payoutCents * item.quantity;
      if (item.createdAt > current.lastAddedAt) {
        current.lastAddedAt = item.createdAt;
      }

      map.set(item.marketHashName, current);
      return map;
    }, new Map<string, PortfolioGroup>())
  )
    .map(([, group]) => ({
      ...group,
      items: [...group.items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }))
    .sort((a, b) => b.totalCurrent - a.totalCurrent);
}

function getRangeStart(range: ChartRange, items: PortfolioItemLike[], history: MarketPriceHistoryLike[]) {
  const now = Date.now();
  const offsets: Record<Exclude<ChartRange, "all">, number> = {
    "1d": 24 * 60 * 60 * 1000,
    "3d": 3 * 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000
  };

  if (range !== "all") {
    return new Date(now - offsets[range]);
  }

  const timestamps = [
    ...items.map((item) => item.createdAt.getTime()),
    ...history.map((entry) => entry.capturedAt.getTime())
  ].sort((a, b) => a - b);

  return new Date(timestamps[0] ?? now);
}

function samplePoints(points: PortfolioChartPoint[], limit = 72) {
  if (points.length <= limit) {
    return points;
  }

  const step = (points.length - 1) / (limit - 1);
  const sampled: PortfolioChartPoint[] = [];

  for (let index = 0; index < limit; index += 1) {
    sampled.push(points[Math.round(index * step)]);
  }

  return sampled;
}

export function buildPortfolioChart(items: PortfolioItemLike[], history: MarketPriceHistoryLike[], range: ChartRange) {
  if (items.length === 0) {
    return {
      points: [] as PortfolioChartPoint[],
      changeCents: 0,
      startLabel: "",
      endLabel: "",
      currentLabel: formatUsd(0)
    };
  }

  const rangeStart = getRangeStart(range, items, history);
  const now = new Date();
  const priceHistoryByMarket = new Map<string, MarketPriceHistoryLike[]>();

  for (const entry of history.sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime())) {
    const bucket = priceHistoryByMarket.get(entry.marketHashName) ?? [];
    bucket.push(entry);
    priceHistoryByMarket.set(entry.marketHashName, bucket);
  }

  const eventTimes = new Set<number>([rangeStart.getTime(), now.getTime()]);

  for (const item of items) {
    if (item.createdAt >= rangeStart) {
      eventTimes.add(item.createdAt.getTime());
    }
  }

  for (const entry of history) {
    if (entry.capturedAt >= rangeStart) {
      eventTimes.add(entry.capturedAt.getTime());
    }
  }

  const sortedTimes = Array.from(eventTimes).sort((a, b) => a - b);
  const historyPointers = new Map<string, number>();
  const knownPrices = new Map<string, number>();

  for (const [marketHashName, entries] of priceHistoryByMarket) {
    const initialIndex = entries.findLastIndex((entry) => entry.capturedAt <= rangeStart);
    historyPointers.set(marketHashName, Math.max(initialIndex + 1, 0));
    if (initialIndex >= 0) {
      knownPrices.set(marketHashName, entries[initialIndex].currentPriceCents);
    }
  }

  const points = sortedTimes.map((timestamp) => {
    const moment = new Date(timestamp);

    for (const [marketHashName, entries] of priceHistoryByMarket) {
      let pointer = historyPointers.get(marketHashName) ?? 0;

      while (pointer < entries.length && entries[pointer].capturedAt <= moment) {
        knownPrices.set(marketHashName, entries[pointer].currentPriceCents);
        pointer += 1;
      }

      historyPointers.set(marketHashName, pointer);
    }

    const totalValueCents = items.reduce((sum, item) => {
      if (item.createdAt > moment) {
        return sum;
      }

      const price = knownPrices.get(item.marketHashName) ?? item.addedPriceCents;
      return sum + price * item.quantity;
    }, 0);

    return {
      timestamp: moment,
      totalValueCents
    };
  });

  const sampledPoints = samplePoints(points);
  const firstPoint = sampledPoints[0] ?? { timestamp: now, totalValueCents: 0 };
  const lastPoint = sampledPoints.at(-1) ?? firstPoint;

  return {
    points: sampledPoints,
    changeCents: lastPoint.totalValueCents - firstPoint.totalValueCents,
    startLabel: firstPoint.timestamp.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }),
    endLabel: lastPoint.timestamp.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }),
    currentLabel: formatUsd(lastPoint.totalValueCents)
  };
}
