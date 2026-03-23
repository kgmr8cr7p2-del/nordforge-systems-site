import Link from "next/link";

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <main className="auth-shell">
      <div className="top-nav">
        <Link className="brand-title" href="/">
          NORDFORGE PORTFOLIO
        </Link>
      </div>

      <section className="auth-card">
        <p className="eyebrow">Восстановление</p>
        <h1>Сбросить пароль</h1>
        <p className="muted">
          Мы отправим ссылку для восстановления на email, после чего можно будет
          задать новый пароль.
        </p>

        {params.error ? <div className="page-message error">{params.error}</div> : null}
        {params.success ? <div className="page-message success">{params.success}</div> : null}

        <form action="/auth/forgot-password" className="auth-form" method="post">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" placeholder="name@example.com" required type="email" />
          </div>

          <button className="primary-btn" type="submit">
            Отправить ссылку
          </button>
        </form>

        <div className="auth-links">
          <Link className="secondary-btn" href="/login">
            Вернуться ко входу
          </Link>
        </div>
      </section>
    </main>
  );
}
