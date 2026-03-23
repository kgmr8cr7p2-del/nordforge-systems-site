import Link from "next/link";

type SearchParams = Promise<{
  token?: string;
  error?: string;
}>;

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const token = params.token || "";

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
        {!token ? (
          <div className="page-message error">Ссылка восстановления повреждена или пустая.</div>
        ) : (
          <form action="/auth/reset-password" className="auth-form" method="post">
            <input name="token" type="hidden" value={token} />

            <div className="field">
              <label htmlFor="password">Новый пароль</label>
              <input id="password" minLength={8} name="password" required type="password" />
            </div>

            <button className="primary-btn" type="submit">
              Сохранить пароль
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
