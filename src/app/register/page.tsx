import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

type SearchParams = Promise<{
  error?: string;
}>;

export default async function RegisterPage({
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
        <p className="eyebrow">Регистрация</p>
        <h1>Создать аккаунт</h1>
        <p className="muted">
          После регистрации пользователь получает личный портфель и может сразу добавлять
          покупки предметов CS2.
        </p>

        {params.error ? <div className="page-message error">{params.error}</div> : null}

        <form action="/auth/register" className="auth-form" method="post">
          <div className="field">
            <label htmlFor="displayName">Имя</label>
            <input id="displayName" name="displayName" placeholder="Как к вам обращаться" />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" placeholder="name@example.com" required type="email" />
          </div>

          <div className="field">
            <label htmlFor="password">Пароль</label>
            <input id="password" minLength={8} name="password" required type="password" />
          </div>

          <button className="primary-btn" type="submit">
            Создать аккаунт
          </button>
        </form>

        <div className="auth-links">
          <Link className="secondary-btn" href="/login">
            Уже есть аккаунт
          </Link>
        </div>
      </section>
    </main>
  );
}
