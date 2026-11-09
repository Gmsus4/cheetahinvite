const defaultDestination = "/dashboard";
const authPages = ["/login", "/registro", "/recuperar-contrasena", "/restablecer-contrasena", "/api/auth"];

/** Always return an internal path, including when Auth.js supplies an absolute callback URL. */
export function safeAuthDestination(value: unknown, origin = "https://auth.invalid"): string {
  if (typeof value !== "string" || !value || /[\s\\\u0000-\u001f\u007f]/.test(value) || value.startsWith("//")) return defaultDestination;
  if (!value.startsWith("/") && !/^https?:\/\//i.test(value)) return defaultDestination;
  try {
    const base = new URL(origin);
    const url = new URL(value, base);
    if (url.origin !== base.origin || url.username || url.password) return defaultDestination;
    const path = decodeURIComponent(url.pathname);
    if (path.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(path)) return defaultDestination;
    const normalizedPath = new URL(path, base).pathname.replace(/\/+$/, "");
    if (authPages.some(page => normalizedPath === page || normalizedPath.startsWith(`${page}/`))) return defaultDestination;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return defaultDestination;
  }
}

export function authPageHref(page: "/login" | "/registro", destination: string): string {
  return `${page}?${new URLSearchParams({ callbackUrl: safeAuthDestination(destination) })}`;
}
