"use client";

import { useEffect, useRef, useState } from "react";
import { FiArrowRight, FiArrowUpRight, FiMenu, FiX } from "react-icons/fi";
import { BrandWordmark } from "@/components/BrandWordmark";
import { ThemeToggle } from "@/components/ThemeToggle";

const navigation = [
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "precios", label: "Precios" },
  { id: "preguntas-frecuentes", label: "Preguntas" },
];

export function Navbar({ homePage = true }: { homePage?: boolean }) {
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sections = ["inicio", ...navigation.map(({ id }) => id)]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    let frame: number | null = null;
    const update = () => {
      frame = null;
      const readingLine = (header.current?.getBoundingClientRect().bottom ?? 96) + 40;
      const current = sections.findLast((section) => section.getBoundingClientRect().top <= readingLine);
      setActiveSection(current?.id ?? "inicio");
      setScrolled(window.scrollY > 12);
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      toggle.current?.focus();
    };
    const onOutside = (event: Event) => {
      if (!header.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const close = () => setMenuOpen(false);
    const desktop = window.matchMedia("(min-width: 761px)");
    const previousOverflow = document.body.style.overflow;
    if (!desktop.matches) document.body.style.overflow = "hidden";
    const containFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || desktop.matches) return;
      const items = Array.from(header.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
        .filter(element => element.getClientRects().length > 0);
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    const onDeviceChange = () => { if (desktop.matches) close(); };
    document.addEventListener("keydown", onEscape);
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("focusin", onOutside);
    document.addEventListener("keydown", containFocus);
    desktop.addEventListener("change", onDeviceChange);
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("focusin", onOutside);
      document.removeEventListener("keydown", containFocus);
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", onDeviceChange);
    };
  }, [menuOpen]);

  return (
    <header ref={header} className={`site-header home-navbar${scrolled ? " is-scrolled" : ""}`}>
      <a className="home-skip-link" href="#inicio">Ir al contenido</a>
      <div className="home-navbar-shell">
        <a className="brand" href={homePage ? "#inicio" : "/"} aria-label="Soccasion, inicio" onClick={() => setMenuOpen(false)}>
          <BrandWordmark priority />
        </a>

        <button
          ref={toggle}
          className="home-menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="home-primary-navigation"
          aria-label={menuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        </button>

        <nav id="home-primary-navigation" className="main-nav" aria-label="Navegación principal" data-open={menuOpen || undefined}>
          <span className="home-menu-label">EXPLORA SOCCASION</span>
          <a className="home-mobile-link" href={homePage ? "#inicio" : "/"} onClick={() => setMenuOpen(false)}>Inicio</a>
          <a className="home-mobile-link" href="/demo" onClick={() => setMenuOpen(false)}>Ver diseños</a>
          {navigation.map(({ id, label }) => <a
            key={id}
            href={`${homePage ? "" : "/"}#${id}`}
            aria-current={homePage && activeSection === id ? "location" : undefined}
            onClick={() => setMenuOpen(false)}
          >{label}</a>)}
          <div className="home-menu-support">
            <span className="home-menu-label">ESTAMOS PARA AYUDARTE</span>
            <a href="/ayuda" onClick={() => setMenuOpen(false)}>Ayuda y soporte <FiArrowUpRight aria-hidden="true" /></a>
            <a href="/dashboard" onClick={() => setMenuOpen(false)}>Mi panel <FiArrowUpRight aria-hidden="true" /></a>
          </div>
          <div className="header-actions">
            <div className="home-appearance">
              <span className="home-appearance-label">Apariencia</span>
              <ThemeToggle variant="subtle" />
            </div>
            <a className="login-link" href="/login" onClick={() => setMenuOpen(false)}>
              Iniciar sesión <FiArrowUpRight aria-hidden="true" />
            </a>
            <a className="button button-small" href="/crear" onClick={() => setMenuOpen(false)}>Crear invitación <FiArrowRight aria-hidden="true" /></a>
          </div>
          <div className="home-menu-legal">
            <a href="/terminos" onClick={() => setMenuOpen(false)}>Términos y condiciones</a>
            <a href="/aviso-de-privacidad" onClick={() => setMenuOpen(false)}>Privacidad</a>
          </div>
        </nav>
      </div>
    </header>
  );
}
