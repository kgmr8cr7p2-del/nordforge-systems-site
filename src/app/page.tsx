import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="landing-shell">
      <div className="landing-grid">
        <section className="hero-card">
          <p className="eyebrow">NORDFORGE PORTFOLIO</p>
          <h1>Портфель CS2 с живыми ценами, авторизацией и историей каждой покупки.</h1>
          <p className="hero-text">
            Пользователь заходит через Telegram или email, создаёт портфель, добавляет
            предметы из Steam Market и получает автоматический пересчёт цен каждый час.
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
            <h2>Что уже заложено</h2>
            <ul>
              <li>Авторизация через email и Telegram.</li>
              <li>Восстановление доступа по email.</li>
              <li>Поиск предметов CS2 с подсказками.</li>
              <li>Хранение каждой отдельной покупки.</li>
              <li>Автоматический пересчёт цен, комиссий и вывода.</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
