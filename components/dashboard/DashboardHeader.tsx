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
      {guest ? <Link className={styles.guestAction} href="/login">Iniciar sesión</Link> : <DashboardAccountMenu name={name} email={email} image={image} onDashboard={onDashboard} active={active} guard={guard} />}
    </div>
  </header>;
}
