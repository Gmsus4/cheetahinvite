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

  useLayoutEffect(() => {
    if (!open) return;
    const positionPanel = () => {
      const button = trigger.current;
      const menu = panel.current;
      if (!button || !menu) return;
      const viewport = window.visualViewport;
      let top = viewport?.offsetTop ?? 0;
      let bottom = top + (viewport?.height ?? window.innerHeight);
      // A scrolling navigation panel can clip the popup before the viewport does.
      for (let parent = root.current?.parentElement; parent; parent = parent.parentElement) {
        if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(parent).overflowY)) {
          const bounds = parent.getBoundingClientRect();
          top = Math.max(top, bounds.top);
          bottom = Math.min(bottom, bounds.bottom);
        }
      }
      const bounds = button.getBoundingClientRect();
      const below = bottom - bounds.bottom - 20;
      const above = bounds.top - top - 20;
      const opensAbove = below < menu.scrollHeight && above > below;
      menu.style.top = opensAbove ? "auto" : "calc(100% + 12px)";
      menu.style.bottom = opensAbove ? "calc(100% + 12px)" : "auto";
      menu.style.maxHeight = `${Math.max(0, opensAbove ? above : below)}px`;
    };
    positionPanel();
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    window.visualViewport?.addEventListener("resize", positionPanel);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
      window.visualViewport?.removeEventListener("resize", positionPanel);
    };
  }, [open]);

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
