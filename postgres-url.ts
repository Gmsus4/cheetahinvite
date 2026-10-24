const legacySslModes = new Set(["prefer", "require", "verify-ca"]);

export function useExplicitSslMode(connectionString: string) {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode");
    if (sslMode && legacySslModes.has(sslMode.toLowerCase())) {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}
