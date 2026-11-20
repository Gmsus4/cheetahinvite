"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandWordmark } from "@/components/BrandWordmark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardAccountMenu } from "./DashboardAccountMenu";
import styles from "./DashboardHeader.module.css";

export function DashboardHeader({ name, email, image, onDashboard = false, active, guard, guest = false }: {
  name: string; email: string; image?: string | null; onDashboard?: boolean; active?: "purchases" | "help"; guard?: (event: { preventDefault(): void }, href: string) => void; guest?: boolean;
}) {
  const pathname = usePathname();
  const navigation = [
    { href: "/dashboard", label: "Mis invitaciones", current: pathname === "/dashboard" || pathname.startsWith("/dashboard/eventos") },
    { href: "/dashboard/compras", label: "Mis compras", current: pathname.startsWith("/dashboard/compras") },
    { href: "/dashboard/ajustes", label: "Mi cuenta", current: pathname.startsWith("/dashboard/ajustes") },
  ];
  return <header className={styles.header}>
    <div className={styles.shell}>
      <Link className="brand" href="/dashboard" onNavigate={event => guard?.(event, "/dashboard")} aria-label="Soccasion, mi espacio"><BrandWordmark priority /></Link>
      {!guest && <nav className={styles.navigation} aria-label="Mi espacio">
        {navigation.map(item => <Link key={item.href} href={item.href} aria-current={item.current ? "page" : undefined} onNavigate={event => guard?.(event, item.href)}>{item.label}</Link>)}
      </nav>}
      <div className={styles.actions}><ThemeToggle />{guest ? <Link className={styles.guestAction} href="/login"><span className={styles.guestLabel}>Iniciar sesión</span><span className={styles.guestShortLabel}>Entrar</span></Link> : <DashboardAccountMenu name={name} email={email} image={image} onDashboard={onDashboard} active={active} guard={guard} />}</div>
    </div>
  </header>;
}
