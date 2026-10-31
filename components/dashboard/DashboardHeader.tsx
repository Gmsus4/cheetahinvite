"use client";

import Link from "next/link";
import { BrandEmblem } from "@/components/BrandEmblem";
import { DashboardAccountMenu } from "./DashboardAccountMenu";
import styles from "./DashboardHeader.module.css";

export function DashboardHeader({ name, email, image, onDashboard = false, active, guard, guest = false }: {
  name: string; email: string; image?: string | null; onDashboard?: boolean; active?: "purchases" | "help"; guard?: (event: { preventDefault(): void }, href: string) => void; guest?: boolean;
}) {
  return <header className={styles.header}>
    <div className={styles.shell}>
      <Link className="brand" href="/dashboard" onNavigate={event => guard?.(event, "/dashboard")} aria-label="Cheetah Invite, mi espacio"><BrandEmblem size={40} priority /><span className="brand-name">Cheetah<span>Invite</span></span></Link>
      <nav className={styles.nav} aria-label="Navegación de mi espacio">
        <Link href={onDashboard ? "#mis-invitaciones" : "/dashboard#mis-invitaciones"} onNavigate={event => guard?.(event, onDashboard ? "#mis-invitaciones" : "/dashboard#mis-invitaciones")} aria-current={onDashboard ? "location" : undefined}>Mis invitaciones</Link>
        <Link href="/dashboard/compras" onNavigate={event => guard?.(event, "/dashboard/compras")} aria-current={active === "purchases" ? "page" : undefined}>Mis compras</Link>
        <Link href="/ayuda" onNavigate={event => guard?.(event, "/ayuda")} aria-current={active === "help" ? "page" : undefined}>Ayuda</Link>
      </nav>
      {guest ? <Link className={styles.guestAction} href="/login">Iniciar sesión</Link> : <DashboardAccountMenu name={name} email={email} image={image} guard={guard} />}
    </div>
  </header>;
}
