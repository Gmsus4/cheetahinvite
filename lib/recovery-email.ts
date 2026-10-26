import "server-only";

export function recoveryEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const origin = new URL(process.env.APP_URL || "");
  if (!apiKey || !from || (origin.protocol !== "https:" && !(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname)))) {
    throw new Error("Password recovery email configuration is missing or invalid");
  }
  return { apiKey, from, origin: origin.origin };
}

export async function sendRecoveryEmail(email: string, token: string, tokenHash: string) {
  const { apiKey, from, origin } = recoveryEmailConfig();
  const url = new URL("/restablecer-contrasena", origin);
  // A fragment keeps the secret out of HTTP access logs and referrer URLs.
  url.hash = new URLSearchParams({ token }).toString();
  const link = url.toString();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `password-recovery/${tokenHash}`,
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Recupera tu acceso a Cheetah Invite",
      text: `Solicitaste restablecer tu contraseña de Cheetah Invite.\n\nAbre este enlace: ${link}\n\nEl enlace vence en 30 minutos y solo puede utilizarse una vez. Si no solicitaste el cambio, ignora este correo.`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Recovery email delivery failed (${response.status})`);
}
