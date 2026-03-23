import Link from "next/link";
import { ItemSearchForm } from "@/components/item-search-form";
import { ItemThumb } from "@/components/item-thumb";
import { PortfolioChart } from "@/components/portfolio-chart";
import { requireCurrentUser } from "@/lib/auth";
import { formatUsd } from "@/lib/money";
import {
  buildPortfolioChart,
  chartRanges,
  groupPortfolioItems,
  resolveChartRange,
  resolveDashboardView,
  sumPortfolio
} from "@/lib/portfolio";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  error?: string;
  success?: string;
  view?: string;
  range?: string;
}>;

export default async function DashboardPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const activeView = resolveDashboardView(params.view);
  const activeRange = resolveChartRange(params.range);

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

  const grouped = groupPortfolioItems(portfolio.items);
  const totals = sumPortfolio(portfolio.items);
  const marketHashNames = [...new Set(portfolio.items.map((item) => item.marketHashName))];

  const history =
    marketHashNames.length > 0
      ? await prisma.marketPriceHistory.findMany({
          where: {
            marketHashName: {
              in: marketHashNames
            }
          },
          orderBy: {
            capturedAt: "asc"
          }
        })
      : [];

  const chart = buildPortfolioChart(portfolio.items, history, activeRange);
  const lastPriceUpdate = portfolio.items[0]?.priceUpdatedAt || history.at(-1)?.capturedAt || null;

  return (
    <main className="dashboard-page">
      <section className="dashboard-shell">
        <div className="dashboard-topbar">
          <div className="dashboard-title">
            <p className="eyebrow">NORDFORGE PORTFOLIO</p>
            <h1>Отслеживайте свой CS2-портфель в одном месте</h1>
            <p className="muted">
              Добавляйте покупки, смотрите стоимость с комиссией Steam и навывод, а
              одинаковые предметы автоматически собираются в одну карточку с раскрытием по
              каждой отдельной сделке.
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

        <section className="dashboard-hero">
          <div className="dashboard-hero-copy">
            <span className="hero-chip">Пользователь: {user.displayName || user.telegramUsername || user.email || "без имени"}</span>
            <h2>Портфель показывает текущую цену, стоимость после комиссии и навывод.</h2>
            <p className="muted">
              График строится по истории обновлений и покупок. Данные пересчитываются раз в
              час для всех пользователей.
            </p>
          </div>

          <div className="dashboard-meta">
            <article className="stat-card">
              <span>Всего предметов</span>
              <strong>{totals.count}</strong>
            </article>
            <article className="stat-card">
              <span>Сумма при добавлении</span>
              <strong className="mono">{formatUsd(totals.added)}</strong>
            </article>
            <article className="stat-card">
              <span>Текущая стоимость</span>
              <strong className="mono">{formatUsd(totals.current)}</strong>
            </article>
            <article className="stat-card">
              <span>Навывод (-35%)</span>
              <strong className="mono">{formatUsd(totals.payout)}</strong>
            </article>
          </div>
        </section>

        {params.error ? <div className="page-message error">{params.error}</div> : null}
        {params.success ? <div className="page-message success">{params.success}</div> : null}

        <div className="view-switcher">
          <Link className={activeView === "portfolio" ? "switch-btn active" : "switch-btn"} href="/dashboard?view=portfolio">
            Портфель
          </Link>
          <Link className={activeView === "chart" ? "switch-btn active" : "switch-btn"} href={`/dashboard?view=chart&range=${activeRange}`}>
            График стоимости
          </Link>
          <span className="switch-note">
            {lastPriceUpdate
              ? `Последнее обновление: ${lastPriceUpdate.toLocaleString("ru-RU")}`
              : "История начнет копиться после первых обновлений цен."}
          </span>
        </div>

        {activeView === "portfolio" ? (
          <div className="dashboard-layout">
            <section className="panel-card add-panel">
              <p className="eyebrow">Добавить предмет</p>
              <h2>Новая покупка в портфель</h2>
              <p className="muted">
                Начните вводить название предмета, выберите подсказку из Steam и задайте
                количество. Текущая цена подтянется автоматически.
              </p>
              <div className="panel-separator" />
              <ItemSearchForm />
            </section>

            <aside className="panel-card panel-card--narrow portfolio-sidecard">
              <p className="eyebrow">Как это работает</p>
              <h2>Портфель вынесен в отдельный широкий блок</h2>
              <p className="muted">
                Сверху теперь отдельные карточки для добавления предмета и короткой сводки.
                Ниже идет сам портфель на всю ширину, чтобы одинаковые предметы и история
                покупок читались без тесной сетки.
              </p>

              <div className="insight-list">
                <div className="insight-card">
                  <span>Сложенных позиций</span>
                  <strong>{grouped.length}</strong>
                </div>
                <div className="insight-card">
                  <span>Всего покупок</span>
                  <strong>{portfolio.items.length}</strong>
                </div>
                <div className="insight-card">
                  <span>После комиссии Steam</span>
                  <strong className="mono">{formatUsd(totals.steamNet)}</strong>
                </div>
              </div>
            </aside>

            <section className="portfolio-panel portfolio-panel--wide">
              <div className="portfolio-panel-head">
                <div>
                  <p className="eyebrow">Ваш портфель</p>
                  <h2>Сложенные позиции и история покупок</h2>
                </div>
                <p className="muted">
                  Одинаковые предметы складываются в одну позицию. Нажмите на карточку, чтобы
                  раскрыть отдельные покупки по датам и ценам.
                </p>
              </div>

              {grouped.length === 0 ? (
                <div className="empty-state">
                  Пока пусто. Добавьте первый предмет из Steam Market, и он сразу появится в
                  портфеле.
                </div>
              ) : (
                <div className="portfolio-stack">
                  {grouped.map((group) => (
                    <details className="group-card" key={group.marketHashName}>
                      <summary>
                        <div className="group-main">
                          <ItemThumb alt={group.itemName} size={72} src={group.iconUrl} />
                          <div>
                            <strong>{group.itemName}</strong>
                            <p className="muted">
                              {group.totalQuantity} шт. в портфеле, {group.items.length} покупок
                            </p>
                            <p className="muted">
                              Последнее добавление: {group.lastAddedAt.toLocaleString("ru-RU")}
                            </p>
                          </div>
                        </div>

                        <div className="summary-metrics">
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
                        </div>
                      </summary>

                      <div className="purchase-list">
                        {group.items.map((item) => (
                          <div className="purchase-row" key={item.id}>
                            <div className="purchase-meta">
                              <ItemThumb alt={item.itemName} size={54} src={item.iconUrl} />
                              <div>
                                <strong>{new Date(item.createdAt).toLocaleString("ru-RU")}</strong>
                                <p className="muted">Количество: {item.quantity} шт.</p>
                                <p className="muted">
                                  Обновлено: {new Date(item.priceUpdatedAt).toLocaleString("ru-RU")}
                                </p>
                              </div>
                            </div>

                            <div className="purchase-stats">
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
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="chart-layout">
            <section className="table-card">
              <div className="range-switcher">
                {chartRanges.map((range) => (
                  <Link
                    className={range.key === activeRange ? "range-btn active" : "range-btn"}
                    href={`/dashboard?view=chart&range=${range.key}`}
                    key={range.key}
                  >
                    {range.label}
                  </Link>
                ))}
              </div>

              <PortfolioChart
                changeCents={chart.changeCents}
                currentLabel={chart.currentLabel}
                endLabel={chart.endLabel}
                points={chart.points}
                startLabel={chart.startLabel}
              />
            </section>

            <aside className="panel-card panel-card--narrow">
              <p className="eyebrow">Как читать график</p>
              <h2>Динамика стоимости портфеля</h2>
              <p className="muted">
                Линия показывает, как менялась общая стоимость текущих позиций по истории
                обновлений Steam и вашим датам покупок.
              </p>
              <div className="insight-list">
                <div className="insight-card">
                  <span>Сейчас</span>
                  <strong className="mono">{formatUsd(totals.current)}</strong>
                </div>
                <div className="insight-card">
                  <span>После комиссии</span>
                  <strong className="mono">{formatUsd(totals.steamNet)}</strong>
                </div>
                <div className="insight-card">
                  <span>Навывод</span>
                  <strong className="mono">{formatUsd(totals.payout)}</strong>
                </div>
              </div>

              <div className="mini-stack">
                {grouped.slice(0, 4).map((group) => (
                  <div className="mini-row" key={group.marketHashName}>
                    <ItemThumb alt={group.itemName} size={42} src={group.iconUrl} />
                    <div>
                      <strong>{group.itemName}</strong>
                      <p className="muted">
                        {group.totalQuantity} шт. · {formatUsd(group.totalCurrent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
