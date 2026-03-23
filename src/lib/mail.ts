import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user,
      pass
    }
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const transport = getTransport();

  if (!transport) {
    console.log(`[reset-link] ${email}: ${resetUrl}`);
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transport.sendMail({
    from,
    to: email,
    subject: "Восстановление доступа к портфелю NORDFORGE",
    text: `Откройте ссылку для восстановления доступа: ${resetUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2>Восстановление доступа</h2>
        <p>Нажмите на ссылку ниже, чтобы задать новый пароль:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Ссылка действует 30 минут.</p>
      </div>
    `
  });
}
