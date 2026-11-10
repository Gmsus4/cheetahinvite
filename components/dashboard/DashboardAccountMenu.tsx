"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { FiCreditCard, FiHelpCircle, FiMail, FiSettings, FiGrid } from "react-icons/fi";
import { getSession } from "next-auth/react";
import { DashboardSignOut } from "./DashboardSignOut";
import type { Driver } from "driver.js";
import { accountMenuTourSteps } from "@/lib/account-menu-tour";
import "driver.js/dist/driver.css";
import "./InvitationEditorTour.css";

export function DashboardAccountMenu({ name, email, image, onDashboard = false, active, guard }: { name: string; email: string; image?: string | null; onDashboard?: boolean; active?: "purchases" | "help"; guard?: (event: { preventDefault(): void }, href: string) => void }) {
  const [open, setOpen] = useState(false);
  const [guiding, setGuiding] = useState(false);
  const [tourError, setTourError] = useState("");
  const driverRef = useRef<Driver | null>(null);
  const tourActive = useRef(false);
  const tourGeneration = useRef(0);
  const guideButton = useRef<HTMLButtonElement>(null);
  const [admin, setAdmin] = useState(false);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const id = useId();
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "C";
  const avatar = image && (image.startsWith("https://") || (image.startsWith("/") && !image.startsWith("//"))) && failedImage !== image ? image : null;

  useEffect(() => {
    if (!open) return;
    let active = true;
    void getSession().then(session => { if (active) setAdmin(session?.user?.role === "ADMIN"); }).catch(() => {});
    return () => { active = false; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    function outside(event: PointerEvent) {
      if (!tourActive.current && event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && !tourActive.current) {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  useEffect(() => () => { tourGeneration.current++; driverRef.current?.destroy(); }, []);

  async function startGuide() {
    if (tourActive.current || !panel.current) return;
    const request = ++tourGeneration.current;
    tourActive.current = true; setGuiding(true); setTourError('');
    try {
      const { driver } = await import('driver.js');
      if (request !== tourGeneration.current) return;
      if (!panel.current) { tourActive.current = false; setGuiding(false); return; }
      const steps = accountMenuTourSteps().filter(step => panel.current?.querySelector(step.element as string)).map(step => ({ ...step, element: panel.current!.querySelector(step.element as string)! }));
      root.current?.setAttribute('data-account-tour-active', 'true');
      driverRef.current = driver({
        steps, disableActiveInteraction: true, overlayClickBehavior: 'none',
        animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        overlayOpacity: .6, stagePadding: 6, stageRadius: 12,
        popoverClass: 'invitation-tour-popover', showProgress: true, progressText: '{{current}} de {{total}}',
        nextBtnText: 'Siguiente', prevBtnText: 'Anterior', doneBtnText: 'Terminar', closeBtnLabel: 'Salir de la guía',
        onPopoverRender: popover => {
          popover.wrapper.setAttribute('lang', 'es');
          if (window.matchMedia('(max-width: 600px)').matches && panel.current) {
            panel.current.style.maxHeight = `${Math.max(88, popover.wrapper.getBoundingClientRect().top - panel.current.getBoundingClientRect().top - 12)}px`;
          }
        },
        onHighlighted: element => element?.scrollIntoView({ block: 'nearest', behavior: 'instant' }),
        onDestroyed: () => {
          driverRef.current = null; root.current?.removeAttribute('data-account-tour-active');
          if (panel.current) panel.current.style.maxHeight = '';
          setGuiding(false);
          guideButton.current?.focus({ preventScroll: true });
          tourActive.current = false;
        },
      });
      driverRef.current.drive();
    } catch {
      driverRef.current?.destroy(); root.current?.removeAttribute('data-account-tour-active');
      tourActive.current = false; setGuiding(false);
      setTourError('No pudimos abrir la guía. Intenta de nuevo.');
    }
  }

  return <div className="dashboard-account-menu" ref={root} onBlur={event => {
    if (!tourActive.current && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={trigger} className="dashboard-account-trigger" type="button" aria-label="Menú de mi cuenta" aria-expanded={open} aria-controls={id} onClick={() => { if (!tourActive.current) setOpen(value => !value); }}>
      {avatar ? <Image src={avatar} alt="" width={44} height={44} unoptimized onError={() => setFailedImage(avatar)} /> : <span aria-hidden="true">{initials}</span>}
    </button>
    {open && <nav id={id} ref={panel} className="dashboard-account-panel" aria-label="Opciones de mi cuenta">
      <div className="dashboard-account-identity"><strong>{name}</strong><small>{email}</small></div>
      <Link data-account-tour="invitations" href={onDashboard ? "#mis-invitaciones" : "/dashboard#mis-invitaciones"} onNavigate={event => guard?.(event, onDashboard ? "#mis-invitaciones" : "/dashboard#mis-invitaciones")} onClick={() => setOpen(false)} aria-current={onDashboard ? "location" : undefined}><FiMail aria-hidden="true" /><span className="dashboard-account-label">Mis invitaciones</span></Link>
      <Link data-account-tour="purchases" aria-current={active === "purchases" ? "page" : undefined} href="/dashboard/compras" onNavigate={event => guard?.(event, "/dashboard/compras")} onClick={() => setOpen(false)}><FiCreditCard aria-hidden="true" /><span className="dashboard-account-label">Mis compras</span></Link>
      <Link data-account-tour="settings" href="/dashboard/ajustes" onNavigate={event => guard?.(event, "/dashboard/ajustes")} onClick={() => setOpen(false)}><FiSettings aria-hidden="true" /><span className="dashboard-account-label">Ajustes de cuenta</span></Link>
      {admin && <Link data-account-tour="admin" href="/admin" onNavigate={event => guard?.(event, "/admin")} onClick={() => setOpen(false)}><FiGrid aria-hidden="true" /><span className="dashboard-account-label">Administración</span></Link>}
      <Link data-account-tour="help" aria-current={active === "help" ? "page" : undefined} href="/ayuda" onNavigate={event => guard?.(event, "/ayuda")} onClick={() => setOpen(false)}><FiHelpCircle aria-hidden="true" /><span className="dashboard-account-label">Ayuda y soporte</span></Link>
      <button ref={guideButton} className="dashboard-account-guide" type="button" onClick={() => void startGuide()} aria-disabled={guiding}><FiHelpCircle aria-hidden="true" /><span>{guiding ? "Guía en curso…" : "Conocer este menú"}</span></button>
      {tourError && <p className="dashboard-account-tour-error" role="alert">{tourError}</p>}
      <DashboardSignOut className="dashboard-account-signout" />
    </nav>}
  </div>;
}
