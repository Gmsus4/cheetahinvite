import "server-only";
import { stripeIsConfigured } from "@/lib/stripe";

export type PaymentProvider = "stripe" | "paypal" | "mercadopago";

export function paymentCheckoutOrigin() {
  const url = new URL(process.env.APP_URL!);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid payment APP_URL");
  const loopback = url.hostname === "localhost" || url.hostname.endsWith(".localhost")
    || url.hostname === "[::1]" || /^(127\.|0\.0\.0\.0$)/.test(url.hostname);
  if (process.env.VERCEL === "1" && (url.protocol !== "https:" || loopback)) throw new Error("Vercel payment APP_URL must use a public HTTPS origin");
  return url.origin;
}
export function isPaymentProvider(value: unknown): value is PaymentProvider {
  return value === "stripe" || value === "paypal" || value === "mercadopago";
}
export function providerLiveMode(provider: PaymentProvider) {
  if (provider === "paypal") return process.env.PAYPAL_ENVIRONMENT === "live";
  if (provider === "mercadopago") return process.env.MERCADOPAGO_ENVIRONMENT === "live";
  return /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY ?? "");
}
export function paymentProviderConfigured(provider: string) {
  if (provider === "stripe") return stripeIsConfigured();
  if (!process.env.APP_URL) return false;
  if (provider === "paypal") return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && process.env.PAYPAL_WEBHOOK_ID && ["sandbox", "live"].includes(process.env.PAYPAL_ENVIRONMENT ?? ""));
  if (provider === "mercadopago") return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.MERCADOPAGO_WEBHOOK_SECRET && ["sandbox", "live"].includes(process.env.MERCADOPAGO_ENVIRONMENT ?? ""));
  return false;
}

async function jsonResponse(response: Response) {
  if (!response.ok) throw new Error(`Payment provider request failed (${response.status})`);
  return response.json();
}
export async function paypalRequest(path: string, body?: unknown, requestId?: string) {
  const origin = providerLiveMode("paypal") ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const token = await jsonResponse(await fetch(`${origin}/v1/oauth2/token`, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(10000),
    headers: { Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  }));
  return jsonResponse(await fetch(`${origin}${path}`, {
    method: body === undefined ? "GET" : "POST", cache: "no-store", signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json", ...(requestId ? { "PayPal-Request-Id": requestId } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));
}
export async function mercadoPagoRequest(path: string, body?: unknown, method?: "PUT", requestId?: string) {
  return jsonResponse(await fetch(`https://api.mercadopago.com${path}`, {
    method: method ?? (body === undefined ? "GET" : "POST"), cache: "no-store", signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`, "Content-Type": "application/json", ...(requestId ? { "X-Idempotency-Key": requestId } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));
}

export async function mercadoPagoPaymentEnvironmentMatches(remote: { live_mode?: boolean; collector_id?: string | number }, live: boolean) {
  if (remote.live_mode === live) return true;
  if (live || remote.live_mode !== true || !remote.collector_id) return false;
  // Payments from an APP_USR test seller can report live_mode=true. Only
  // accept that exception after authenticating the matching test collector.
  const seller = await mercadoPagoRequest("/users/me");
  return seller.id != null && String(seller.id) === String(remote.collector_id)
    && Array.isArray(seller.tags) && seller.tags.includes("test_user");
}
