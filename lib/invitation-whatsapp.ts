export function splitWhatsAppPhone(phone: string): { countryCode: string; number: string } {
  if (!phone) return { countryCode: "52", number: "" };
  // New edits retain the separator so incomplete numbers also reopen correctly.
  const formatted = phone.match(/^\+(\d{0,3}) (.*)$/);
  if (formatted) return { countryCode: formatted[1], number: formatted[2].replace(/\D/g, "") };
  const digits = phone.replace(/\D/g, "");
  const shortCodes = /^(1|7|20|27|30|31|32|33|34|36|39|40|41|43|44|45|46|47|48|49|51|52|53|54|55|56|57|58|60|61|62|63|64|65|66|81|82|84|86|90|91|92|93|94|95|98)/;
  const countryCode = digits.match(shortCodes)?.[0] ?? digits.slice(0, 3);
  return { countryCode, number: digits.slice(countryCode.length) };
}

export function invitationWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/[\s()+.-]/g, "");
  if (!/^[1-9]\d{6,14}$/.test(digits)) return "";
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function parseInvitationWhatsAppLink(link: string): { phone: string; message: string } | null {
  try {
    const url = new URL(link);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    const phone = url.hostname === "wa.me" ? url.pathname.slice(1).replace(/\/$/, "")
      : ["api.whatsapp.com", "web.whatsapp.com"].includes(url.hostname) && url.pathname === "/send" ? url.searchParams.get("phone") ?? "" : "";
    if (!invitationWhatsAppLink(phone, "")) return null;
    return { phone, message: url.searchParams.get("text") ?? "" };
  } catch {
    return null;
  }
}
