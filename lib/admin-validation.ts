export function parsePriceAmount(value: unknown) {
  if (typeof value !== "string" || !/^\d{1,6}(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return amount >= 1000 && amount <= 99999900 ? amount : null;
}

export function adminText(form: FormData, name: string, maximum: number) {
  const value = form.get(name);
  if (typeof value !== "string" || value.trim().length > maximum) return "";
  return value.trim();
}

export function adminPage(value: string | string[] | undefined) {
  return typeof value === "string" && /^\d{1,5}$/.test(value) ? Math.max(1, Number(value)) : 1;
}

export function adminRegistrationRange(fromValue: string | string[] | undefined, toValue: string | string[] | undefined) {
  const parse = (value: typeof fromValue) => {
    if (value === undefined || value === "") return "";
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "0001-01-01") return null;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
  };
  const from = parse(fromValue);
  const to = parse(toValue);
  const error = from === null || to === null ? "Revisa las fechas de registro."
    : from && to && from > to ? "La fecha desde debe ser anterior o igual a la fecha hasta." : "";
  // Registration days use central Mexico time; the final day is inclusive.
  const createdAt = !error && (from || to) ? {
    ...(from ? { gte: new Date(`${from}T00:00:00-06:00`) } : {}),
    ...(to ? { lt: new Date(new Date(`${to}T00:00:00-06:00`).getTime() + 86400000) } : {}),
  } : undefined;
  return { from: from || "", to: to || "", error, createdAt };
}

export function analyticsRange(value: string | string[] | undefined, now = new Date()) {
  const days = value === "7" ? 7 : value === "90" ? 90 : 30;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return { days, from: new Date(new Date(`${today}T00:00:00-06:00`).getTime() - (days - 1) * 86400000), to: now };
}
