import Link from "next/link";
import Image from "next/image";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { invitationPath } from "@/lib/invitation-url";
import { supportMailto } from "@/lib/support";
import { isInvitationPublished } from "@/lib/invitation-payment";
import { canEditInvitation, invitationLifecycle } from "@/lib/invitation-lifecycle";
import {
  FiArrowUpRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiFileText,
  FiGift,
  FiPlus,
  FiHelpCircle,
  FiSettings,
  FiLock,
  FiExternalLink,
  FiCopy,
} from "react-icons/fi";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CopyInvitationLink } from "@/components/dashboard/CopyInvitationLink";
import { DeleteInvitationButton } from "@/components/dashboard/DeleteInvitationButton";
import { CourtesyNotice } from "@/components/dashboard/CourtesyNotice";
import { CreationDraftResume } from "@/components/dashboard/CreationDraftResume";

type EventStatus = "DRAFT" | "PENDING_PAYMENT" | "PUBLISHED" | "EXPIRED" | "ARCHIVED" | "SUSPENDED" | "REFUNDED";

type DashboardEvent = {
  id: string;
  name: string;
  eventType: string;
  imageUrl: string | null;
  status: EventStatus;
  eventDate: Date | null;
  expiresAt: Date | null;
  paidAt: Date | null;
  complimentaryAt?: Date | null;
  courtesyNoticeId?: string | null;
  slug: string | null;
  ownerId: string;
  customSlug: string | null;
  privacy?: string;
  updatedAt: Date;
};

type DashboardContentProps = {
  ownerId: string;
  now: number;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  events: DashboardEvent[];
};

const statusLabels: Record<EventStatus, string> = {
  DRAFT: "Borrador",
  PENDING_PAYMENT: "Pendiente de pago",
  PUBLISHED: "Publicado",
  EXPIRED: "Vencido",
  ARCHIVED: "Archivado",
  SUSPENDED: "Suspendido por disputa",
  REFUNDED: "Reembolsado",
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

export function DashboardContent({ ownerId, userName, userEmail, userImage, events, now }: DashboardContentProps) {
  const availableSlots = Math.max(0, ACCOUNT_LIMITS.invitations - events.length);
  const firstName = userName.trim().split(/\s+/)[0] || "bienvenido";
  const activeEvents = events.filter((event) => isInvitationPublished(event, new Date(now))).length;
  const drafts = events.filter((event) => event.status === "DRAFT").length;
  const courtesyEvents = events.filter((event) => event.complimentaryAt && !event.paidAt && canEditInvitation(event, new Date(now)));
  const courtesyIds = new Set(courtesyEvents.map((event) => event.id));
  const unreadCourtesyEvents = courtesyEvents.filter((event) => event.courtesyNoticeId);
  const soon = now + 30 * 24 * 60 * 60 * 1000;
  const expiring = events.filter(
    (event) =>
      event.status === "PUBLISHED" &&
      event.expiresAt &&
      event.expiresAt.getTime() >= now &&
      event.expiresAt.getTime() <= soon,
  ).length;

  return (
    <div className="dashboard-page dashboard-home-style">
      <a className="dashboard-skip-link" href="#mis-invitaciones">Ir a mis invitaciones</a>
      <DashboardHeader name={userName} email={userEmail} image={userImage} onDashboard />

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-welcome-row">
            <div>
              <p className="dashboard-eyebrow"><span className="dashboard-eyebrow-dot" /> TU ESPACIO PARA CELEBRAR</p>
              <h1>¡Hola, <em>{firstName}!</em></h1>
              <p className="dashboard-subtitle">Cada celebración empieza con una invitación. Aquí puedes crear, editar y compartir las tuyas.</p>
            </div>
            {availableSlots > 0 ? <Link className="button dashboard-create-button" href="/crear">
              Nueva invitación <FiArrowUpRight aria-hidden="true" />
            </Link> : <span className="dashboard-capacity-full">Tus {ACCOUNT_LIMITS.invitations} espacios están ocupados</span>}
          </div>
          <div className="dashboard-draft-recovery"><CreationDraftResume ownerId={ownerId} /></div>
          {unreadCourtesyEvents.length > 0 && <section className="dashboard-courtesy-notices" aria-label="Cortesías recibidas">
            {unreadCourtesyEvents.map((event) => <CourtesyNotice key={event.courtesyNoticeId} grantId={event.courtesyNoticeId!} eventId={event.id} name={event.name} expiresAt={event.expiresAt!} published={isInvitationPublished(event, new Date(now))} />)}
          </section>}
          <section className="dashboard-events-section" id="mis-invitaciones" aria-labelledby="dashboard-events-title" tabIndex={-1}>
            <div className="dashboard-section-heading">
              <div>
                <p className="dashboard-eyebrow">TUS MOMENTOS ESPECIALES</p>
                <h2 id="dashboard-events-title">Mis invitaciones</h2>
              </div>
              <div className="dashboard-slot-meter"><span><strong>{events.length}</strong> de {ACCOUNT_LIMITS.invitations} espacios utilizados</span><div role="img" aria-label={`${events.length} de ${ACCOUNT_LIMITS.invitations} espacios utilizados`}>{Array.from({ length: ACCOUNT_LIMITS.invitations }, (_, index) => <i key={index} className={index < events.length ? "is-used" : ""} />)}</div></div>
            </div>

              <div className="dashboard-invitation-grid">
                {events.map((event, index) => (
                  <article className="dashboard-invitation-card" key={event.id}>
                    <div className={`dashboard-invitation-cover${event.imageUrl ? " has-image" : ""}`}>
                      {event.imageUrl ? <Image src={event.imageUrl} alt={`Portada de ${event.name}`} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1050px) 50vw, 33vw" /> : <FiGift className="dashboard-cover-gift" aria-hidden="true" />}
                      <span className={`dashboard-status status-${event.status.toLowerCase()}`}><i aria-hidden="true" />{["PUBLISHED", "EXPIRED"].includes(event.status) && invitationLifecycle(event, new Date(now))?.phase !== "active" ? "Archivado" : statusLabels[event.status]}</span>
                      <span className="dashboard-invitation-number">INVITACIÓN {String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="dashboard-invitation-body">
                      <div className="dashboard-invitation-type-row"><span className="dashboard-invitation-type">{eventLabels[event.eventType] ?? event.eventType}</span>{courtesyIds.has(event.id) && <span className="dashboard-courtesy-badge"><FiGift aria-hidden="true" /> Cortesía</span>}</div>
                      <h3>{event.name}</h3>
                      <div className="dashboard-invitation-meta">
                        <span className="dashboard-invitation-date"><FiCalendar aria-hidden="true" /> {formatDate(event.eventDate)}</span>
                        {event.privacy === "PRIVATE" && <span className="dashboard-invitation-privacy"><FiLock aria-hidden="true" /> Protegida con PIN</span>}
                      </div>
                      <div className="dashboard-invitation-actions">
                        <Link className="dashboard-card-edit" href={`/dashboard/eventos/${event.id}${canEditInvitation(event, new Date(now)) ? "" : "/pago"}`} aria-label={`${["DRAFT", "PENDING_PAYMENT"].includes(event.status) ? "Continuar invitación" : "Administrar invitación"}: ${event.name}`}><FiEdit2 aria-hidden="true" /> {canEditInvitation(event, new Date(now)) ? ["DRAFT", "PENDING_PAYMENT"].includes(event.status) ? "Continuar" : "Editar" : "Ver vigencia"}</Link>
                        <Link className="dashboard-card-payment" href={`/dashboard/eventos/${event.id}/ajustes`} aria-label={`Ajustes de ${event.name}`}><FiSettings aria-hidden="true" /> Ajustes</Link>
                        <div className="dashboard-card-share">
                          {isInvitationPublished(event, new Date(now)) && event.slug ? <CopyInvitationLink path={invitationPath(event)!} /> : <>
                            <button className="dashboard-event-open" type="button" disabled title="Disponible cuando tu invitación esté publicada" aria-label="Ver invitación: disponible cuando esté publicada"><FiExternalLink aria-hidden="true" /><span>Ver</span></button>
                            <button className="dashboard-event-share" type="button" disabled title="Disponible cuando tu invitación esté publicada" aria-label="Compartir invitación: disponible cuando esté publicada"><FiCopy aria-hidden="true" /><span>Compartir</span></button>
                          </>}
                        </div>
                      </div>
                      <div className="dashboard-card-footer"><a href={supportMailto({ email: userEmail, eventId: event.id, eventName: event.name })} aria-label={`Pedir soporte para ${event.name}`}><FiHelpCircle aria-hidden="true" /> Ayuda</a><DeleteInvitationButton eventId={event.id} eventName={event.name} /></div>
                      <small className="dashboard-card-updated">Actualizada el {formatDate(event.updatedAt)}</small>
                    </div>
                  </article>
                ))}
                {Array.from({ length: availableSlots }, (_, index) => <Link href="/crear" className="dashboard-invitation-slot" key={`slot-${index}`}>
                  <span className="dashboard-slot-number">ESPACIO {String(events.length + index + 1).padStart(2, "0")}</span>
                  <span className="dashboard-slot-plus"><FiPlus aria-hidden="true" /></span>
                  <h3>{events.length === 0 && index === 0 ? "Tu primera invitación" : "Tu próxima celebración"}</h3>
                  <p>Un nuevo momento merece su propia invitación. Dale tu estilo y compártelo.</p>
                  <span className="dashboard-slot-cta">Crear invitación <FiArrowUpRight aria-hidden="true" /></span>
                </Link>)}
              </div>
            <p className="dashboard-slot-explanation">Puedes tener hasta {ACCOUNT_LIMITS.invitations} invitaciones en tu cuenta.{availableSlots === 0 ? " Si necesitas crear otra, primero elimina una que ya no uses." : ` Te ${availableSlots === 1 ? "queda 1 espacio disponible" : `quedan ${availableSlots} espacios disponibles`}.`}</p>
          </section>

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

          <footer className="dashboard-footer">
            <span>Hecho para celebrar cada historia.</span>
            <nav aria-label="Información legal">
              <Link href="/ayuda">Ayuda y soporte</Link>
              <Link href="/terminos">Términos</Link>
              <Link href="/aviso-de-privacidad">Privacidad</Link>
            </nav>
          </footer>
        </div>
      </main>
    </div>
  );
}
