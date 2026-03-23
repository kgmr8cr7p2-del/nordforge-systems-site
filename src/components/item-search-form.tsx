"use client";

import { useEffect, useMemo, useState } from "react";

type SearchResult = {
  itemName: string;
  marketHashName: string;
  iconUrl: string | null;
  currentPriceCents: number;
  steamNetCents: number;
  payoutCents: number;
  priceText: string;
};

export function ItemSearchForm() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/steam/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
          cache: "no-store"
        });
        const payload = (await response.json()) as { results?: SearchResult[] };
        setResults(payload.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query, selected]);

  const hint = useMemo(() => {
    if (!selected) {
      return null;
    }

    return (
      <div className="selected-item">
        <strong>{selected.itemName}</strong>
        <p className="muted">Steam сейчас: {selected.priceText}</p>
        <p className="muted">
          После комиссии Steam: {(selected.steamNetCents / 100).toFixed(2)} USD, навывод:{" "}
          {(selected.payoutCents / 100).toFixed(2)} USD
        </p>
      </div>
    );
  }, [selected]);

  return (
    <form action="/portfolio/add" method="post" className="search-stack">
      <div className="field">
        <label htmlFor="item-query">Предмет CS2</label>
        <input
          id="item-query"
          name="itemQuery"
          value={selected ? selected.itemName : query}
          onChange={(event) => {
            setSelected(null);
            setQuery(event.target.value);
          }}
          placeholder="Например: AK-47 | Redline (Field-Tested)"
          autoComplete="off"
        />
      </div>

      <input name="itemName" type="hidden" value={selected?.itemName || ""} />
      <input name="marketHashName" type="hidden" value={selected?.marketHashName || ""} />
      <input name="iconUrl" type="hidden" value={selected?.iconUrl || ""} />

      {hint}

      {!selected && loading ? <p className="muted">Ищу предметы в Steam…</p> : null}

      {!selected && results.length > 0 ? (
        <div className="search-results">
          {results.map((result) => (
            <button
              key={result.marketHashName}
              className="search-result-btn"
              onClick={(event) => {
                event.preventDefault();
                setSelected(result);
                setResults([]);
                setQuery(result.itemName);
              }}
              type="button"
            >
              <strong>{result.itemName}</strong>
              <small>{result.priceText}</small>
            </button>
          ))}
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="quantity">Количество</label>
        <input defaultValue={1} id="quantity" min={1} name="quantity" step={1} type="number" />
      </div>

      <button className="primary-btn" type="submit">
        Добавить в портфель
      </button>
    </form>
  );
}
