import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="landing-shell">
      <div className="landing-grid">
        <section className="hero-card">
          <p className="eyebrow">NORDFORGE PORTFOLIO</p>
          <h1>Следите за своим CS2-портфелем, покупками и динамикой стоимости в одном сервисе.</h1>
          <p className="hero-text">
            У нас есть собственный портфель для отслеживания предметов: добавляете покупки,
            смотрите текущую цену, комиссию Steam, навывод и как меняется стоимость всего
            портфеля по дням и неделям.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" href={user ? "/dashboard" : "/register"}>
              {user ? "Открыть портфель" : "Создать аккаунт"}
            </Link>
            <Link className="secondary-btn" href={user ? "/dashboard" : "/login"}>
              {user ? "Перейти в кабинет" : "Войти"}
            </Link>
          </div>
        </section>

        <section className="feature-panel">
          <article className="feature-card">
            <p className="eyebrow">Отслеживание</p>
            <h2>Что умеет портфель</h2>
            <p className="muted">
              Сервис собирает одинаковые предметы в одну позицию, но оставляет внутри
              историю каждой отдельной покупки с датой и собственной статистикой.
            </p>
            <div className="feature-list">
              <div className="feature-pill">Email и Telegram-вход</div>
              <div className="feature-pill">Поиск по Steam Market</div>
              <div className="feature-pill">График 1/3/7/30 дней и all-time</div>
              <div className="feature-pill">Почасовое обновление цен</div>
            </div>
          </article>

          <article className="feature-card">
            <p className="eyebrow">Как работает</p>
            <h2>От покупки до графика</h2>
            <ol className="feature-steps">
              <li>Входите в аккаунт и открываете личный кабинет.</li>
              <li>Добавляете предметы из подсказок Steam и фиксируете количество.</li>
              <li>Портфель автоматически считает текущую цену, Steam net и навывод.</li>
              <li>На вкладке графика видно, как меняется стоимость всего портфеля.</li>
            </ol>
            <Link className="secondary-btn" href={user ? "/dashboard" : "/register"}>
              {user ? "Перейти в портфель" : "Попробовать портфель"}
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}
