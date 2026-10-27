"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { FiCreditCard, FiHelpCircle, FiSettings } from "react-icons/fi";
import { DashboardSignOut } from "./DashboardSignOut";

export function DashboardAccountMenu({ name, email, image }: { name: string; email: string; image?: string | null }) {
  const [open, setOpen] = useState(false);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const id = useId();
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "C";
  const avatar = image && (image.startsWith("https://") || (image.startsWith("/") && !image.startsWith("//"))) && failedImage !== image ? image : null;

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
      <Link href="/dashboard/compras" onClick={() => setOpen(false)}><FiCreditCard aria-hidden="true" /> Mis compras</Link>
      <Link href="/dashboard/ajustes" onClick={() => setOpen(false)}><FiSettings aria-hidden="true" /> Ajustes de cuenta</Link>
      <Link href="/ayuda" onClick={() => setOpen(false)}><FiHelpCircle aria-hidden="true" /> Ayuda y soporte</Link>
      <DashboardSignOut className="dashboard-account-signout" />
    </nav>}
  </div>;
}
