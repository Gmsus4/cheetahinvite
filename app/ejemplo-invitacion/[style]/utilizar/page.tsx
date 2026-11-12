import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/auth";
import { BrandLoader } from "@/components/BrandLoader";
import { StyleSubmitButton } from "@/components/landing/StyleSubmitButton";
import { authPageHref } from "@/lib/auth-destination";
import { canEditInvitation } from "@/lib/invitation-lifecycle";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { getShowcaseInvitation } from "@/lib/showcase";
import { prisma } from "@/prisma";
import { useExampleStyle } from "./actions";
import styles from "./style-selection.module.css";

export const metadata: Metadata = { title: "Utilizar este estilo | Cheetah Invite", robots: { index: false, follow: false } };

type Props = { params: Promise<{ style: string }>; searchParams: Promise<{ error?: string }> };

export default function UseExampleStylePage(props: Props) {
  return <Suspense fallback={<BrandLoader message="Preparando este estilo…" />}><StyleSelection {...props} /></Suspense>;
}

async function StyleSelection({ params, searchParams }: Props) {
  await connection();
  const { style } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(authPageHref("/login", `/ejemplo-invitacion/${encodeURIComponent(style)}/utilizar`));
  const invitation = await getShowcaseInvitation(style);
  if (!invitation) notFound();
  const [user, events, query] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { invitationCount: true } }),
    prisma.event.findMany({ where: { ownerId: session.user.id, isExample: false }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, contentVersion: true, status: true, paidAt: true, complimentaryAt: true, expiresAt: true } }),
    searchParams,
  ]);
  const editable = events.filter(event => canEditInvitation(event));
  const limitReached = !user || user.invitationCount >= ACCOUNT_LIMITS.invitations;
  const action = useExampleStyle.bind(null, style);
  const messages: Record<string, string> = {
    conflict: "La invitación cambió en otra pestaña. Revisa los datos actualizados y vuelve a aplicar el estilo.",
    limit: "Ya utilizaste tus espacios de invitación. Puedes aplicar el estilo a una existente.",
    unavailable: "La invitación elegida ya no está disponible para edición.",
    blocks: "Este estilo y tus bloques superan el límite de 16. Reduce los bloques de tu invitación antes de aplicar el estilo.",
    invalid: "No pudimos identificar la invitación. Vuelve a elegir una opción.",
    save: "No pudimos aplicar el estilo. Intenta de nuevo.",
  };
  return <main className={styles.page}>
    <div className={styles.content}>
      <Link className={styles.back} href={`/ejemplo-invitacion/${encodeURIComponent(style)}`}>← Volver al diseño</Link>
      <h1>Haz este estilo tuyo</h1>
      <p className={styles.lead}>Elige dónde utilizar el diseño de «{invitation.name}».</p>
      {query.error && <p className={styles.error} role="alert">{messages[query.error] || messages.save}</p>}
      <section className={styles.card}>
        <h2>Crear una invitación nueva</h2>
        <p>Empieza con los colores, las tipografías, las fotos, el fondo y los bloques de este diseño. Incluye datos de ejemplo que podrás personalizar en el editor.</p>
        <form action={action}>
          <input type="hidden" name="eventId" value="new" />
          <input type="hidden" name="creationKey" value={randomUUID()} />
          <StyleSubmitButton disabled={limitReached}>Crear con este estilo</StyleSubmitButton>
        </form>
        {limitReached && <p className={styles.note}>Ya utilizaste tus {ACCOUNT_LIMITS.invitations} espacios. Elige una invitación existente.</p>}
      </section>
      <section className={styles.card}>
        <h2>Aplicar a una invitación existente</h2>
        <p>Actualiza la apariencia y los bloques conservando los datos y las fotos de tu evento. Los bloques que no existen en este estilo también se conservan.</p>
        <p className={styles.note}>Los bloques nuevos pueden incluir contenido de ejemplo. Si tu invitación ya está publicada, el cambio será visible para tus invitados al aplicar el estilo.</p>
        {editable.length ? <div className={styles.events}>{editable.map(event => <form action={action} key={event.id} className={styles.event}>
          <input type="hidden" name="eventId" value={event.id} />
          <input type="hidden" name="contentVersion" value={event.contentVersion} />
          <div><h3>{event.name}</h3><span>{event.status === "PUBLISHED" ? "Publicada" : "Borrador"}</span></div>
          <StyleSubmitButton>Aplicar estilo</StyleSubmitButton>
        </form>)}</div> : <p className={styles.note}>Aún no tienes invitaciones disponibles para editar.</p>}
      </section>
    </div>
  </main>;
}
