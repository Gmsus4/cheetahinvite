"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiArrowUpRight, FiBarChart2, FiCreditCard, FiGift, FiGrid, FiLayers, FiTag, FiUsers } from "react-icons/fi";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { ReactNode } from "react";

const links = [
  { href: "/admin", label: "Resumen", Icon: FiGrid },
  { href: "/admin/disenos", label: "Diseños y ejemplos", Icon: FiLayers },
  { href: "/admin/precio", label: "Precio", Icon: FiTag },
  { href: "/admin/clientes", label: "Clientes", Icon: FiUsers },
  { href: "/admin/ventas", label: "Ventas y pagos", Icon: FiCreditCard },
  { href: "/admin/estadisticas", label: "Estadísticas", Icon: FiBarChart2 },
  { href: "/admin/cortesias", label: "Cortesías", Icon: FiGift },
];

export function AdminShell({ children, account }: { children: ReactNode; account: { name: string | null; email: string | null; image: string | null } }) {
  const pathname = usePathname();
  const editor = /^\/admin\/disenos\/[^/]+\/(editar|vista-previa)$/.test(pathname);
  if (editor) return children;
  return <main className="admin-page">
    <DashboardHeader name={account.name || "Administrador"} email={account.email || ""} image={account.image} />
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-heading"><span className="admin-eyebrow">CHEETAH INVITE</span><strong>Tu negocio,<br /><em>a tu manera.</em></strong><span className="admin-access-badge">Administración</span></div>
        <nav aria-label="Administración">{links.map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={(href === "/admin" ? pathname === href : pathname.startsWith(href)) ? "page" : undefined}><Icon aria-hidden="true" />{label}</Link>)}</nav>
        <Link className="admin-return" href="/dashboard">Volver a mi espacio <FiArrowUpRight aria-hidden="true" /></Link>
        <Link className="admin-return" href="/?vista=publica" target="_blank">Ver sitio público <FiArrowUpRight aria-hidden="true" /></Link>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  </main>;
}
