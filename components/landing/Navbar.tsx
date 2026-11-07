"use client";

import { useEffect, useRef, useState } from "react";
import { FiArrowRight, FiArrowUpRight, FiMenu, FiX } from "react-icons/fi";
import { BrandEmblem } from "@/components/BrandEmblem";
import { ThemeToggle } from "@/components/ThemeToggle";

const navigation = [
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "precios", label: "Precios" },
  { id: "preguntas-frecuentes", label: "Preguntas" },
];

export function Navbar() {
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
    const desktop = window.matchMedia("(min-width: 801px)");
    const onDeviceChange = () => { if (desktop.matches) close(); };
    document.addEventListener("keydown", onEscape);
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("focusin", onOutside);
    window.addEventListener("scroll", close, { passive: true });
    desktop.addEventListener("change", onDeviceChange);
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("focusin", onOutside);
      window.removeEventListener("scroll", close);
      desktop.removeEventListener("change", onDeviceChange);
    };
  }, [menuOpen]);

  return (
    <header ref={header} className={`site-header home-navbar${scrolled ? " is-scrolled" : ""}`}>
      <a className="home-skip-link" href="#inicio">Ir al contenido</a>
      <div className="home-navbar-shell">
        <a className="brand" href="#inicio" aria-label="Cheetah Invite, inicio" onClick={() => setMenuOpen(false)}>
          <BrandEmblem size={40} priority />
          <span className="brand-name">
            Cheetah<span>Invite</span>
          </span>
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
          {navigation.map(({ id, label }) => <a
            key={id}
            href={`#${id}`}
            aria-current={activeSection === id ? "location" : undefined}
            onClick={() => setMenuOpen(false)}
          >{label}</a>)}
          <div className="header-actions">
            <ThemeToggle variant="subtle" />
            <a className="login-link" href="/login" onClick={() => setMenuOpen(false)}>
              Iniciar sesión <FiArrowUpRight aria-hidden="true" />
            </a>
            <a className="button button-small" href="/crear" onClick={() => setMenuOpen(false)}>Crear invitación <FiArrowRight aria-hidden="true" /></a>
          </div>
        </nav>
      </div>
    </header>
  );
}
