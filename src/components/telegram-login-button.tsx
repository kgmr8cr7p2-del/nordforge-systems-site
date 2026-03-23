"use client";

import { useEffect, useRef, useState } from "react";

type TelegramAuthPayload = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthPayload) => void;
  }
}

export function TelegramLoginButton() {
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!botUsername || !widgetRef.current) {
      return;
    }

    const widgetContainer = widgetRef.current;
    widgetContainer.innerHTML = "";

    window.onTelegramAuth = async (user) => {
      setError(null);

      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error || "Не удалось войти через Telegram.");
        return;
      }

      window.location.href = "/dashboard";
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    widgetContainer.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
      widgetContainer.innerHTML = "";
    };
  }, [botUsername]);

  if (!botUsername) {
    return (
      <div className="page-message error">
        Telegram-вход скрыт, пока не задан `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`.
      </div>
    );
  }

  return (
    <div className="telegram-box">
      <p className="muted">Или войдите через Telegram.</p>
      <div ref={widgetRef} />
      {error ? <div className="page-message error">{error}</div> : null}
    </div>
  );
}
