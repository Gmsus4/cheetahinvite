import { isThemePreference, resolveTheme, THEME_STORAGE_KEY, type ThemePreference } from "./theme";

const changeEvent = "cheetah-theme-change";
let memoryPreference: ThemePreference | undefined;

export function readThemePreference(): ThemePreference {
  if (memoryPreference) return memoryPreference;
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

function applyTheme() {
  document.documentElement.dataset.theme = resolveTheme(readThemePreference(), window.matchMedia("(prefers-color-scheme: dark)").matches);
}

export function subscribeThemePreference(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      memoryPreference = undefined;
      callback();
    }
  };
  window.addEventListener(changeEvent, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(changeEvent, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function setThemePreference(value: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, value);
    memoryPreference = undefined;
  } catch {
    memoryPreference = value;
  }
  applyTheme();
  window.dispatchEvent(new Event(changeEvent));
}

export function syncThemeWithBrowser() {
  applyTheme();
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", applyTheme);
  const unsubscribe = subscribeThemePreference(applyTheme);
  return () => {
    media.removeEventListener("change", applyTheme);
    unsubscribe();
  };
}
