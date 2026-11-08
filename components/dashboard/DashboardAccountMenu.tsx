"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { FiCreditCard, FiHelpCircle, FiMail, FiSettings, FiGrid } from "react-icons/fi";
import { getSession } from "next-auth/react";
import { DashboardSignOut } from "./DashboardSignOut";

export function DashboardAccountMenu({ name, email, image, onDashboard = false, active, guard }: { name: string; email: string; image?: string | null; onDashboard?: boolean; active?: "purchases" | "help"; guard?: (event: { preventDefault(): void }, href: string) => void }) {
  const [open, setOpen] = useState(false);
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
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
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

  return <div className="dashboard-account-menu" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={trigger} className="dashboard-account-trigger" type="button" aria-label="Menú de mi cuenta" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
      {avatar ? <Image src={avatar} alt="" width={44} height={44} unoptimized onError={() => setFailedImage(avatar)} /> : <span aria-hidden="true">{initials}</span>}
    </button>
    {open && <nav id={id} ref={panel} className="dashboard-account-panel" aria-label="Opciones de mi cuenta">
      <div className="dashboard-account-identity"><strong>{name}</strong><small>{email}</small></div>
      <Link href={onDashboard ? "#mis-invitaciones" : "/dashboard#mis-invitaciones"} onNavigate={event => guard?.(event, onDashboard ? "#mis-invitaciones" : "/dashboard#mis-invitaciones")} onClick={() => setOpen(false)} aria-current={onDashboard ? "location" : undefined}><FiMail aria-hidden="true" /> Mis invitaciones</Link>
      <Link aria-current={active === "purchases" ? "page" : undefined} href="/dashboard/compras" onNavigate={event => guard?.(event, "/dashboard/compras")} onClick={() => setOpen(false)}><FiCreditCard aria-hidden="true" /> Mis compras</Link>
      <Link href="/dashboard/ajustes" onNavigate={event => guard?.(event, "/dashboard/ajustes")} onClick={() => setOpen(false)}><FiSettings aria-hidden="true" /> Ajustes de cuenta</Link>
      {admin && <Link href="/admin" onNavigate={event => guard?.(event, "/admin")} onClick={() => setOpen(false)}><FiGrid aria-hidden="true" /> Administración</Link>}
      <Link aria-current={active === "help" ? "page" : undefined} href="/ayuda" onNavigate={event => guard?.(event, "/ayuda")} onClick={() => setOpen(false)}><FiHelpCircle aria-hidden="true" /> Ayuda y soporte</Link>
      <DashboardSignOut className="dashboard-account-signout" />
    </nav>}
  </div>;
}
