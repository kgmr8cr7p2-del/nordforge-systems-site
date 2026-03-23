import Link from "next/link";
import { ItemSearchForm } from "@/components/item-search-form";
import { requireCurrentUser } from "@/lib/auth";
import { formatUsd } from "@/lib/money";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

function sumPortfolio(
  items: Array<{
    quantity: number;
    addedPriceCents: number;
    currentPriceCents: number;
    steamNetCents: number;
    payoutCents: number;
  }>
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

export default async function DashboardPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const params = await searchParams;

  let portfolio = await prisma.portfolio.findUnique({
    where: {
      userId: user.id
    },
    include: {
      items: {
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: {
        userId: user.id
      },
      include: {
        items: true
      }
    });
  }

  const grouped = Array.from(
    portfolio.items.reduce((map, item) => {
      const current = map.get(item.marketHashName) ?? {
        marketHashName: item.marketHashName,
        itemName: item.itemName,
        items: [] as typeof portfolio.items,
        totalQuantity: 0,
        totalAdded: 0,
        totalCurrent: 0,
        totalSteamNet: 0,
        totalPayout: 0
      };

      current.items.push(item);
      current.totalQuantity += item.quantity;
      current.totalAdded += item.addedPriceCents * item.quantity;
      current.totalCurrent += item.currentPriceCents * item.quantity;
      current.totalSteamNet += item.steamNetCents * item.quantity;
      current.totalPayout += item.payoutCents * item.quantity;
      map.set(item.marketHashName, current);
      return map;
    }, new Map<string, {
      marketHashName: string;
      itemName: string;
      items: typeof portfolio.items;
      totalQuantity: number;
      totalAdded: number;
      totalCurrent: number;
      totalSteamNet: number;
      totalPayout: number;
    }>())
  ).sort((a, b) => b[1].totalCurrent - a[1].totalCurrent);

  const totals = sumPortfolio(portfolio.items);

  return (
    <main className="dashboard-page">
      <section className="dashboard-shell">
        <div className="dashboard-topbar">
          <div className="dashboard-title">
            <p className="eyebrow">Личный кабинет</p>
            <h1>Портфель CS2</h1>
            <p className="muted">
              Пользователь: {user.displayName || user.telegramUsername || user.email || "без имени"}
            </p>
          </div>

          <div className="inline-actions">
            <Link className="secondary-btn" href="/">
              На главную
            </Link>
            <form action="/auth/logout" method="post">
              <button className="ghost-btn" type="submit">
                Выйти
              </button>
            </form>
          </div>
        </div>

        {params.error ? <div className="page-message error">{params.error}</div> : null}
        {params.success ? <div className="page-message success">{params.success}</div> : null}

        <div className="dashboard-meta">
          <article className="stat-card">
            <span>Записей</span>
            <strong>{portfolio.items.length}</strong>
          </article>
          <article className="stat-card">
            <span>Сумма при добавлении</span>
            <strong className="mono">{formatUsd(totals.added)}</strong>
          </article>
          <article className="stat-card">
            <span>Текущая цена</span>
            <strong className="mono">{formatUsd(totals.current)}</strong>
          </article>
          <article className="stat-card">
            <span>Навывод (-35%)</span>
            <strong className="mono">{formatUsd(totals.payout)}</strong>
          </article>
        </div>

        <div className="dashboard-layout">
          <section className="panel-card">
            <p className="eyebrow">Добавить покупку</p>
            <h2>Новая запись</h2>
            <p className="muted">
              Выберите предмет из Steam-подсказки, укажите количество, и запись попадёт в
              портфель с фиксированной ценой на момент добавления.
            </p>
            <div style={{ height: 18 }} />
            <ItemSearchForm />
          </section>

          <section className="table-card">
            <div>
              <p className="eyebrow">Портфель</p>
              <h2>Позиции и история покупок</h2>
            </div>

            {grouped.length === 0 ? (
              <div className="empty-state">
                Пока пусто. Добавьте первый предмет из Steam Market, и он появится здесь.
              </div>
            ) : (
              grouped.map(([, group]) => (
                <details className="group-card" key={group.marketHashName} open>
                  <summary>
                    <div>
                      <strong>{group.itemName}</strong>
                      <p className="muted">{group.totalQuantity} шт. суммарно</p>
                    </div>
                    <div className="price-grid">
                      <span className="muted">Добавлено</span>
                      <strong className="mono">{formatUsd(group.totalAdded)}</strong>
                    </div>
                    <div className="price-grid">
                      <span className="muted">Сейчас</span>
                      <strong className="mono">{formatUsd(group.totalCurrent)}</strong>
                    </div>
                    <div className="price-grid">
                      <span className="muted">-13% Steam</span>
                      <strong className="mono">{formatUsd(group.totalSteamNet)}</strong>
                    </div>
                    <div className="price-grid">
                      <span className="muted">Навывод</span>
                      <strong className="mono">{formatUsd(group.totalPayout)}</strong>
                    </div>
                  </summary>

                  <div className="purchase-list">
                    {group.items.map((item) => (
                      <div className="purchase-row" key={item.id}>
                        <div>
                          <strong>{new Date(item.createdAt).toLocaleString("ru-RU")}</strong>
                          <p className="muted">Количество: {item.quantity} шт.</p>
                        </div>
                        <div className="price-grid">
                          <span className="muted">При добавлении</span>
                          <strong className="mono">{formatUsd(item.addedPriceCents * item.quantity)}</strong>
                        </div>
                        <div className="price-grid">
                          <span className="muted">Сейчас</span>
                          <strong className="mono">{formatUsd(item.currentPriceCents * item.quantity)}</strong>
                        </div>
                        <div className="price-grid">
                          <span className="muted">-13% Steam</span>
                          <strong className="mono">{formatUsd(item.steamNetCents * item.quantity)}</strong>
                        </div>
                        <div className="price-grid">
                          <span className="muted">Навывод</span>
                          <strong className="mono">{formatUsd(item.payoutCents * item.quantity)}</strong>
                        </div>
                        <form action="/portfolio/delete" method="post">
                          <input name="itemId" type="hidden" value={item.id} />
                          <button className="danger-btn" type="submit">
                            Удалить
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                </details>
              ))
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
