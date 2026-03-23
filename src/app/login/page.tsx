import Link from "next/link";
import { redirect } from "next/navigation";
import { TelegramLoginButton } from "@/components/telegram-login-button";
import { getCurrentUser } from "@/lib/auth";

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

export default async function LoginPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <main className="auth-shell">
      <div className="top-nav">
        <Link className="brand-title" href="/">
          NORDFORGE PORTFOLIO
        </Link>
      </div>

      <section className="auth-card">
        <p className="eyebrow">Вход</p>
        <h1>Войти в портфель</h1>
        <p className="muted">
          Войдите по email или через Telegram. После входа у пользователя появляется
          личный портфель с отдельной историей покупок и актуальными ценами из Steam.
        </p>

        {params.error ? <div className="page-message error">{params.error}</div> : null}
        {params.success ? <div className="page-message success">{params.success}</div> : null}

        <form action="/auth/login" className="auth-form" method="post">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" placeholder="name@example.com" required type="email" />
          </div>

          <div className="field">
            <label htmlFor="password">Пароль</label>
            <input id="password" name="password" required type="password" />
          </div>

          <button className="primary-btn" type="submit">
            Войти
          </button>
        </form>

        <div className="auth-links">
          <Link className="secondary-btn" href="/register">
            Создать аккаунт
          </Link>
          <Link className="ghost-btn" href="/forgot-password">
            Забыл пароль
          </Link>
        </div>

        <TelegramLoginButton />
      </section>
    </main>
  );
}
