"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { FiCheck, FiMonitor, FiMoon, FiSun } from "react-icons/fi";
import { themeInitializationScript, type ThemePreference } from "@/lib/theme";
import { readThemePreference, setThemePreference, subscribeThemePreference, syncThemeWithBrowser } from "@/lib/theme-client";
import styles from "./ThemeToggle.module.css";

export function ThemeScript() {
  return <script type={typeof window === "undefined" ? "text/javascript" : "text/plain"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />;
}

/** Keep the root theme in sync across routes, tabs and operating system changes. */
export function ThemeSync() {
  useLayoutEffect(syncThemeWithBrowser, []);
  return null;
}

const options = [
  { value: "light", label: "Claro", icon: FiSun },
  { value: "dark", label: "Oscuro", icon: FiMoon },
  { value: "system", label: "Sistema", icon: FiMonitor },
] as const;

export function ThemeToggle({ variant = "default" }: { variant?: "default" | "subtle" }) {
  const preference = useSyncExternalStore(subscribeThemePreference, readThemePreference, () => "system" as const);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    const onOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  function choose(value: ThemePreference) {
    setThemePreference(value);
    setOpen(false);
    trigger.current?.focus();
  }

  return <div className={`${styles.root}${variant === "subtle" ? ` ${styles.subtle}` : ""}`} ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={trigger} type="button" className={styles.trigger} aria-label="Cambiar apariencia" title="Cambiar apariencia" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
      <FiSun className={styles.sun} aria-hidden="true" /><FiMoon className={styles.moon} aria-hidden="true" />
    </button>
    {open && <div className={styles.panel} id={id} ref={panel} role="group" aria-label="Apariencia">
      <span className={styles.label}>APARIENCIA</span>
      {options.map(({ value, label, icon: Icon }) => <button className={styles.option} type="button" key={value} aria-pressed={preference === value} onClick={() => choose(value)}>
        <Icon aria-hidden="true" /><span>{label}</span>{preference === value && <FiCheck className={styles.check} aria-hidden="true" />}
      </button>)}
    </div>}
  </div>;
}
