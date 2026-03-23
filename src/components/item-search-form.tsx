"use client";

import { useEffect, useMemo, useState } from "react";
import { ItemThumb } from "@/components/item-thumb";

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
        <ItemThumb alt={selected.itemName} size={56} src={selected.iconUrl} />
        <div>
          <strong>{selected.itemName}</strong>
          <p className="muted">Steam сейчас: {selected.priceText}</p>
          <p className="muted">
            После комиссии Steam: {(selected.steamNetCents / 100).toFixed(2)} USD, навывод:{" "}
            {(selected.payoutCents / 100).toFixed(2)} USD
          </p>
        </div>
      </div>
    );
  }, [selected]);

  return (
    <form action="/portfolio/add" method="post" className="search-stack">
      <input name="itemName" type="hidden" value={selected?.itemName || ""} />
      <input name="marketHashName" type="hidden" value={selected?.marketHashName || ""} />
      <input name="iconUrl" type="hidden" value={selected?.iconUrl || ""} />

      <div className="search-layout">
        <section className="search-card">
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
                  <div className="search-result-content">
                    <ItemThumb alt={result.itemName} size={44} src={result.iconUrl} />
                    <div>
                      <strong>{result.itemName}</strong>
                      <small>{result.priceText}</small>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="search-card search-card--compact">
          <div className="field">
            <label htmlFor="quantity">Количество</label>
            <input defaultValue={1} id="quantity" min={1} name="quantity" step={1} type="number" />
          </div>

          <div className="search-side-note">
            <strong>{selected ? "Предмет выбран" : "Сначала выберите предмет"}</strong>
            <p className="muted">
              {selected
                ? "Цена покупки сохранится сразу, а дальше стоимость будет обновляться автоматически раз в час."
                : "Введите название, выберите подсказку из Steam, затем укажите количество и добавьте покупку в портфель."}
            </p>
          </div>

          <button className="primary-btn search-submit" type="submit">
            Добавить в портфель
          </button>
        </section>
      </div>
    </form>
  );
}
