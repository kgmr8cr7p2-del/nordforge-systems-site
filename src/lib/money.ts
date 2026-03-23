const formatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2
});

export function formatUsd(cents: number) {
  return formatter.format(cents / 100);
}

export function calculateSteamNet(cents: number) {
  return Math.round(cents * 0.87);
}

export function calculateCashout(cents: number) {
  return Math.round(cents * 0.65);
}

export function parsePriceToCents(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (!value) {
    return 0;
  }

  const source = String(value);

  const normalized = source
    .replace(/[^\d.,]/g, "")
    .replace(/,(?=\d{2}$)/, ".")
    .replace(/,/g, "");

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100);
}
