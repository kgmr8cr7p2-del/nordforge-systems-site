import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  return (
    <main className="auth-shell">
      <div className="top-nav">
        <Link className="brand-title" href="/">
          NORDFORGE PORTFOLIO
        </Link>
      </div>

      <section className="auth-card">
        <p className="eyebrow">Новый пароль</p>
        <h1>Задать новый пароль</h1>

        {params.error ? <div className="page-message error">{params.error}</div> : null}
        {params.success ? <div className="page-message success">{params.success}</div> : null}

        {!user ? (
          <div className="page-message error">
            Откройте эту страницу по ссылке из письма восстановления.
          </div>
        ) : (
          <form action="/auth/reset-password" className="auth-form" method="post">
            <div className="field">
              <label htmlFor="password">Новый пароль</label>
              <input id="password" minLength={8} name="password" required type="password" />
            </div>

            <button className="primary-btn" type="submit">
              Сохранить пароль
            </button>
          </form>
        )}

        <div className="auth-links">
          <Link className="secondary-btn" href="/login">
            Вернуться ко входу
          </Link>
        </div>
      </section>
    </main>
  );
}
