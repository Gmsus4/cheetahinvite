import Link from "next/link";
import { invitationPath } from "@/lib/invitation-url";
import { isInvitationPublished } from "@/lib/invitation-payment";
import {
  FiArrowUpRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiFileText,
  FiGift,
  FiUsers,
} from "react-icons/fi";
import { DashboardSignOut } from "@/components/dashboard/DashboardSignOut";
import { BrandEmblem } from "@/components/BrandEmblem";
import { CopyInvitationLink } from "@/components/dashboard/CopyInvitationLink";
import { DeleteInvitationButton } from "@/components/dashboard/DeleteInvitationButton";

type EventStatus = "DRAFT" | "PENDING_PAYMENT" | "PUBLISHED" | "EXPIRED" | "ARCHIVED";

type DashboardEvent = {
  id: string;
  name: string;
  eventType: string;
  imageUrl: string | null;
  status: EventStatus;
  eventDate: Date | null;
  expiresAt: Date | null;
  paidAt: Date | null;
  slug: string | null;
  ownerId: string;
  customSlug: string | null;
  updatedAt: Date;
};

type DashboardContentProps = {
  now: number;
  userName: string;
  userEmail: string;
  events: DashboardEvent[];
};

const statusLabels: Record<EventStatus, string> = {
  DRAFT: "Borrador",
  PENDING_PAYMENT: "Pendiente de pago",
  PUBLISHED: "Publicado",
  EXPIRED: "Vencido",
  ARCHIVED: "Archivado",
};

const eventLabels: Record<string, string> = {
  wedding: "Boda",
  birthday: "Cumpleaños",
  graduation: "Graduación",
  baby_shower: "Baby shower",
  anniversary: "Aniversario",
  other: "Otro evento",
};

function formatDate(date: Date | null) {
  if (!date) return "Fecha por definir";
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function DashboardContent({ userName, userEmail, events, now }: DashboardContentProps) {
  const firstName = userName.trim().split(/\s+/)[0] || "bienvenido";
  const activeEvents = events.filter((event) => isInvitationPublished(event, new Date(now))).length;
  const drafts = events.filter((event) => event.status === "DRAFT").length;
  const soon = now + 30 * 24 * 60 * 60 * 1000;
  const expiring = events.filter(
    (event) =>
      event.status === "PUBLISHED" &&
      event.expiresAt &&
      event.expiresAt.getTime() >= now &&
      event.expiresAt.getTime() <= soon,
  ).length;

  return (
    <div className="dashboard-page">
      <a className="dashboard-skip-link" href="#mis-invitaciones">Ir a mis invitaciones</a>
      <header className="dashboard-header">
        <div className="dashboard-header-shell">
          <Link className="brand" href="/dashboard" aria-label="Cheetah Invite, mi espacio">
            <BrandEmblem size={40} priority />
            <span className="brand-name">Cheetah<span>Invite</span></span>
          </Link>
          <div className="dashboard-account-actions">
            <div className="dashboard-account">
              <span className="dashboard-avatar">{getInitials(userName) || "C"}</span>
              <span className="dashboard-user-copy"><strong>{userName || "Usuario"}</strong><small>{userEmail}</small></span>
            </div>
            <DashboardSignOut />
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-welcome-row">
            <div>
              <p className="dashboard-eyebrow"><span className="dashboard-eyebrow-dot" /> TU ESPACIO PARA CELEBRAR</p>
              <h1>¡Hola, <em>{firstName}!</em></h1>
              <p className="dashboard-subtitle">Cada celebración empieza con una invitación. Aquí puedes crear, editar y compartir las tuyas.</p>
            </div>
            <Link className="button dashboard-create-button" href="/crear">
              Nueva invitación <FiArrowUpRight aria-hidden="true" />
            </Link>
          </div>

          <section className="dashboard-stats" aria-label="Estado de tus invitaciones">
            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon stat-icon-orange"><FiCalendar aria-hidden="true" /></span>
              <span className="dashboard-stat-copy"><small>Invitaciones</small><strong>{events.length}</strong></span>
              <span className="dashboard-stat-caption">en tu cuenta</span>
            </article>
            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon stat-icon-navy"><FiCheckCircle aria-hidden="true" /></span>
              <span className="dashboard-stat-copy"><small>Activas</small><strong>{activeEvents}</strong></span>
              <span className="dashboard-stat-caption">publicadas</span>
            </article>
            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon stat-icon-gray"><FiFileText aria-hidden="true" /></span>
              <span className="dashboard-stat-copy"><small>Borradores</small><strong>{drafts}</strong></span>
              <span className="dashboard-stat-caption">por terminar</span>
            </article>
            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon stat-icon-orange"><FiClock aria-hidden="true" /></span>
              <span className="dashboard-stat-copy"><small>Por vencer</small><strong>{expiring}</strong></span>
              <span className="dashboard-stat-caption">en 30 días</span>
            </article>
          </section>

          <section className="dashboard-events-section" id="mis-invitaciones" aria-labelledby="dashboard-events-title" tabIndex={-1}>
            <div className="dashboard-section-heading">
              <div>
                <p className="dashboard-eyebrow">TUS MOMENTOS ESPECIALES</p>
                <h2 id="dashboard-events-title">Mis invitaciones</h2>
              </div>
              <span className="dashboard-event-count">{events.length} {events.length === 1 ? "invitación" : "invitaciones"}</span>
            </div>

            {events.length ? (
              <div className="dashboard-event-list">
                {events.map((event) => (
                  <article className="dashboard-event-card" key={event.id}>
                    <span className={`dashboard-event-art${event.imageUrl ? " has-image" : ""}`}>
                      {event.imageUrl ? <img src={event.imageUrl} alt={`Portada de ${event.name}`} loading="lazy" /> : <FiGift aria-hidden="true" />}
                    </span>
                    <div className="dashboard-event-info">
                      <span className="dashboard-event-type">{eventLabels[event.eventType] ?? event.eventType}</span>
                      <h3>{event.name}</h3>
                      <span className="dashboard-event-date"><FiCalendar aria-hidden="true" /> {formatDate(event.eventDate)}</span>
                    </div>
                    <span className={`dashboard-status status-${event.status.toLowerCase()}`}>
                      <i aria-hidden="true" />{statusLabels[event.status]}
                    </span>
                    <div className="dashboard-event-updated">
                      <small>Actualizado</small>
                      <span>{formatDate(event.updatedAt)}</span>
                    </div>
                    <div className="dashboard-event-actions">
                      <Link className="dashboard-event-edit" href={`/dashboard/eventos/${event.id}`} aria-label={`Editar invitación: ${event.name}`} title="Editar invitación"><FiEdit2 aria-hidden="true" /><span>Editar</span></Link>
                      {isInvitationPublished(event, new Date(now)) && event.slug && <CopyInvitationLink path={invitationPath(event)!} />}
                      <DeleteInvitationButton eventId={event.id} eventName={event.name} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-state">
                <span className="dashboard-empty-icon"><FiUsers aria-hidden="true" /></span>
                <h3>Aquí empieza algo especial</h3>
                <p>Crea tu primera invitación y dale tu estilo con fotos, colores y los detalles de tu celebración.</p>
                <Link className="button dashboard-empty-button" href="/crear">
                  Crear mi primera invitación <FiArrowUpRight aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>

          <footer className="dashboard-footer">
            <span>Hecho para celebrar cada historia.</span>
            <nav aria-label="Información legal">
              <Link href="/terminos">Términos</Link>
              <Link href="/aviso-de-privacidad">Privacidad</Link>
            </nav>
          </footer>
        </div>
      </main>
    </div>
  );
}
