import { createHmac, timingSafeEqual } from "node:crypto";

export function validMercadoPagoSignature(request: Request, secret: string) {
  const id = new URL(request.url).searchParams.get("data.id");
  const requestId = request.headers.get("x-request-id");
  const parts = Object.fromEntries((request.headers.get("x-signature") ?? "").split(",").map(part => part.trim().split("=")));
  if (!id || !requestId || !/^\d+$/.test(parts.ts ?? "") || !/^[a-f0-9]{64}$/i.test(parts.v1 ?? "")) return false;
  const expected = createHmac("sha256", secret).update(`id:${id.toLowerCase()};request-id:${requestId};ts:${parts.ts};`).digest();
  return timingSafeEqual(expected, Buffer.from(parts.v1, "hex"));
}
