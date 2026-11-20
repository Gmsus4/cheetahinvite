"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./InvitationNavigation.module.css";

export function InvitationNavigation({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/eventos/${eventId}`;
  const items = [
    { href: base, label: "Información" },
    { href: `${base}/ajustes`, label: "Ajustes" },
    { href: `${base}/asistencias`, label: "Asistencias" },
    { href: `${base}/pago`, label: "Pago y soporte" },
  ];
  return <nav className={styles.navigation} aria-label="Administrar esta invitación">
    {items.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}
  </nav>;
}
