import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NORDFORGE Portfolio",
  description: "Портфель предметов CS2 с авторизацией, учётом покупок и обновлением цен."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
