export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "cheetah-invite-theme";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): "light" | "dark" {
  return preference === "system" ? (systemDark ? "dark" : "light") : preference;
}

// Runs during HTML parsing, before the first paint, without making the layout dynamic.
export const themeInitializationScript = `(function(){var t="system";try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");if(s==="light"||s==="dark"||s==="system")t=s}catch(e){}document.documentElement.dataset.theme=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t})()`;
