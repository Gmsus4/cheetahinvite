// Read resource references without following webhook URLs. All API requests use
// the fixed PayPal origin selected by the server's environment configuration.
export function paypalRefundCaptureId(refund: { links?: { rel?: string; href?: string }[] }) {
  const href = refund.links?.find(link => link.rel === "up")?.href;
  if (!href) throw new Error("PayPal refund capture reference missing");
  const url = new URL(href);
  const match = /^\/v2\/payments\/captures\/([A-Za-z0-9_-]+)$/.exec(url.pathname);
  if (url.protocol !== "https:" || !["api-m.paypal.com", "api-m.sandbox.paypal.com", "api.paypal.com", "api.sandbox.paypal.com"].includes(url.hostname)
    || url.username || url.password || url.port || url.search || url.hash || !match) throw new Error("Invalid PayPal capture reference");
  return match[1];
}
