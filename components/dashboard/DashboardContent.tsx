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
  FiHeart,
  FiPlus,
  FiUsers,
} from "react-icons/fi";
import { DashboardSignOut } from "@/components/dashboard/DashboardSignOut";
import { BrandEmblem } from "@/components/BrandEmblem";
import { DashboardSectionNav } from "@/components/dashboard/DashboardSectionNav";
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
  view?: "summary" | "events";
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

export function DashboardContent({ userName, userEmail, events, now, view = "summary" }: DashboardContentProps) {
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
      <aside className="dashboard-sidebar">
        <Link className="brand dashboard-brand" href="/dashboard" aria-label="Cheetah Invite, panel">
          <BrandEmblem size={32} className="dashboard-brand-mark" />
          <span className="brand-name">Cheetah<span>Invite</span></span>
        </Link>

        <p className="dashboard-nav-label">ESPACIO DE TRABAJO</p>
        <DashboardSectionNav eventCount={events.length} activeView={view} />

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-help-card">
            <span className="dashboard-help-icon"><FiHeart aria-hidden="true" /></span>
            <strong>¿Planeando algo especial?</strong>
            <p>Encuentra el diseño que va con tu celebración.</p>
            <Link href="/#plantillas">Explorar diseños <FiArrowUpRight aria-hidden="true" /></Link>
          </div>
          <div className="dashboard-sidebar-user">
            <span className="dashboard-avatar">{getInitials(userName) || "C"}</span>
            <span className="dashboard-user-copy"><strong>{userName || "Usuario"}</strong><small>{userEmail}</small></span>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-mobile-header">
          <Link className="brand dashboard-brand" href="/dashboard" aria-label="Cheetah Invite, panel">
            <BrandEmblem size={32} className="dashboard-brand-mark" />
            <span className="brand-name">Cheetah<span>Invite</span></span>
          </Link>
        </header>

        <div className="dashboard-content">
          <div className="dashboard-welcome-row">
            <div>
              <p className="dashboard-eyebrow">{view === "summary" ? "TU ESPACIO PERSONAL" : "GESTIÓN DE INVITACIONES"}</p>
              <h1>{view === "summary" ? `¡Hola, ${firstName}!` : "Mis eventos"}</h1>
              <p className="dashboard-subtitle">{view === "summary" ? "Aquí puedes organizar las invitaciones de tus momentos especiales." : "Consulta el estado de tus invitaciones y continúa editándolas o compartiéndolas."}</p>
            </div>
            <div className="dashboard-welcome-actions">
              <DashboardSignOut className="dashboard-signout dashboard-signout-prominent" />
              <Link className="button dashboard-create-button" href="/crear">
                <FiPlus aria-hidden="true" /> Nueva invitación
              </Link>
            </div>
          </div>

          {view === "summary" && <section className="dashboard-stats" aria-label="Resumen de eventos">
            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon stat-icon-orange"><FiCalendar aria-hidden="true" /></span>
              <span className="dashboard-stat-copy"><small>Total de eventos</small><strong>{events.length}</strong></span>
              <span className="dashboard-stat-caption">en tu cuenta</span>
            </article>
            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon stat-icon-navy"><FiCheckCircle aria-hidden="true" /></span>
              <span className="dashboard-stat-copy"><small>Invitaciones activas</small><strong>{activeEvents}</strong></span>
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
          </section>}

          <section className="dashboard-events-section">
            <div className="dashboard-section-heading">
              <div>
                <p className="dashboard-eyebrow">{view === "summary" ? "ACTIVIDAD RECIENTE" : "TUS CELEBRACIONES"}</p>
                <h2>{view === "summary" ? "Eventos recientes" : "Todos mis eventos"}</h2>
              </div>
              {view === "summary" ? <Link className="dashboard-event-count dashboard-event-count-link" href="/dashboard/eventos">Ver todos <FiArrowUpRight aria-hidden="true" /></Link> : <span className="dashboard-event-count">{events.length} {events.length === 1 ? "evento" : "eventos"}</span>}
            </div>

            {events.length ? (
              <div className="dashboard-event-list">
                {(view === "summary" ? events.slice(0, 3) : events).map((event) => (
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
                      <Link className="dashboard-event-edit" href={`/dashboard/eventos/${event.id}`} aria-label="Editar invitación" title="Editar invitación"><FiEdit2 aria-hidden="true" /><span>Editar</span></Link>
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
                <p>Aún no tienes eventos. Explora nuestros diseños y encuentra el indicado para tu próxima celebración.</p>
                <Link className="button dashboard-empty-button" href="/crear">
                  Crear mi primer evento <FiArrowUpRight aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>

          <footer className="dashboard-footer">
            <span>Hecho para celebrar cada historia.</span>
            <Link href="/">Volver a Cheetah Invite <FiArrowUpRight aria-hidden="true" /></Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
