import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FiArrowLeft, FiArrowUpRight, FiCalendar, FiGift } from "react-icons/fi";
import { auth } from "@/auth";
import { BrandEmblem } from "@/components/BrandEmblem";
import { createEvent } from "./actions";
import { prisma } from "@/prisma";
import { ACCOUNT_LIMITS } from "@/lib/limits";

export const metadata: Metadata = {
  title: "Nueva invitación | Cheetah Invite",
  description: "Empieza un borrador para tu próxima celebración.",
};

export default async function CreateEventPage({
  searchParams,
}: PageProps<"/crear">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fcrear");

  const params = await searchParams;
  const initialType = typeof params.tipo === "string" ? params.tipo : "";
  const hasError = typeof params.error === "string";
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { invitationCount: true } });
  const invitationLimitReached = (user?.invitationCount ?? 0) >= ACCOUNT_LIMITS.invitations;

  return (
    <main className="create-event-page">
      <header className="create-event-header">
        <Link className="brand" href="/" aria-label="Cheetah Invite, inicio">
          <BrandEmblem size={38} priority />
          <span className="brand-name">Cheetah<span>Invite</span></span>
        </Link>
        <Link className="create-back-link" href="/dashboard"><FiArrowLeft aria-hidden="true" /> Volver a mi panel</Link>
      </header>

      <section className="create-event-card">
        <span className="create-event-icon"><FiGift aria-hidden="true" /></span>
        <p className="dashboard-eyebrow">UN NUEVO MOMENTO PARA CELEBRAR</p>
        <h1>Empecemos con lo esencial</h1>
        <p className="create-event-intro">Guarda estos datos como borrador. Podrás completar y personalizar tu invitación después.</p>

        {invitationLimitReached ? <div className="create-event-limit" role="status"><strong>Ya usaste tus {ACCOUNT_LIMITS.invitations} invitaciones disponibles.</strong><p>Por ahora, cada cuenta puede crear hasta {ACCOUNT_LIMITS.invitations} invitaciones.</p><Link className="button" href="/dashboard">Volver a mi panel</Link></div> : <>
        <p className="create-event-quota">Invitación {(user?.invitationCount ?? 0) + 1} de {ACCOUNT_LIMITS.invitations}</p>

        <form action={createEvent} className="create-event-form">
          <label htmlFor="event-name">Nombre del evento</label>
          <input id="event-name" name="name" placeholder="Ej. Nuestra boda" minLength={2} maxLength={100} required />

          <label htmlFor="event-type">Tipo de evento</label>
          <select id="event-type" name="eventType" defaultValue={initialType} required>
            <option value="" disabled>Selecciona una categoría</option>
            <option value="wedding">Boda</option>
            <option value="birthday">Cumpleaños</option>
            <option value="graduation">Graduación</option>
            <option value="baby_shower">Baby shower</option>
            <option value="anniversary">Aniversario</option>
            <option value="other">Otro evento</option>
          </select>

          <label htmlFor="event-date">Fecha del evento <span>(opcional)</span></label>
          <div className="create-event-date-input"><FiCalendar aria-hidden="true" /><input id="event-date" name="eventDate" type="date" /></div>

          {hasError && <p className="create-event-error" role="alert">{params.error === "limite" ? `Ya alcanzaste el máximo de ${ACCOUNT_LIMITS.invitations} invitaciones.` : "Revisa los datos e inténtalo de nuevo."}</p>}
          <button className="button create-event-submit" type="submit">Guardar borrador <FiArrowUpRight aria-hidden="true" /></button>
        </form>
        </>}
        <p className="create-event-footnote">Todavía no se publica ni se cobra nada.</p>
      </section>
    </main>
  );
}
