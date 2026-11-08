import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiInbox } from "react-icons/fi";
import { BrandLoader } from "@/components/BrandLoader";

// Shared-layout fallbacks cannot cover navigation below an already mounted layout.
// Keep the request-time permissions and data reads behind a boundary in each page.
export function AdminPageBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<BrandLoader message="Cargando administración…" />}>{children}</Suspense>;
}

export function AdminHeading({ eyebrow = "ADMINISTRACIÓN", title, description, children }: { eyebrow?: string; title: string; description: string; children?: ReactNode }) {
  return <div className="admin-heading"><div><span className="admin-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children && <div className="admin-heading-actions">{children}</div>}</div>;
}

export function AdminEmpty({ title, children }: { title: string; children: ReactNode }) {
  return <div className="admin-empty"><span className="admin-empty-icon"><FiInbox aria-hidden="true" /></span><h2>{title}</h2><p>{children}</p></div>;
}

export function AdminNotice({ success, error }: { success?: string | string[]; error?: string | string[] }) {
  if (error) return <div className="admin-notice admin-error" role="alert">{typeof error === "string" ? error : "Revisa los datos e intenta de nuevo."}</div>;
  if (!success) return null;
  return <div className="admin-notice" role="status"><FiCheckCircle aria-hidden="true" />Cambios guardados.</div>;
}

export function AdminPagination({ page, more, href }: { page: number; more: boolean; href: string }) {
  if (page === 1 && !more) return null;
  return <nav className="admin-pagination" aria-label="Páginas de resultados"><span>Página {page}</span><div>{page > 1 && <Link className="admin-button secondary" href={`${href}&page=${page - 1}`}><FiArrowLeft />Anterior</Link>}{more && <Link className="admin-button secondary" href={`${href}&page=${page + 1}`}>Siguiente<FiArrowRight /></Link>}</div></nav>;
}

export const adminDate = (value: Date | null | undefined) => value ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" }).format(value) : "—";
export const eventLabels: Record<string, string> = { wedding: "Boda", birthday: "Cumpleaños", graduation: "Graduación", baby_shower: "Baby shower", anniversary: "Aniversario", other: "Otro evento" };
export const eventStatuses: Record<string, string> = { DRAFT: "Borrador", PENDING_PAYMENT: "Pendiente de pago", PUBLISHED: "Publicada", EXPIRED: "Vencida", ARCHIVED: "Archivada", SUSPENDED: "Suspendida", REFUNDED: "Reembolsada" };
