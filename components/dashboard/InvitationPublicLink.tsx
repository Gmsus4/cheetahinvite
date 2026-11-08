import { FiExternalLink, FiLock } from "react-icons/fi";
import { isInvitationPublished } from "@/lib/invitation-payment";
import { invitationPath } from "@/lib/invitation-url";

type Props = {
  event: {
    ownerId: string;
    customSlug: string | null;
    slug: string | null;
    status: string;
    paidAt: Date | null; complimentaryAt?: Date | null;
    expiresAt: Date | null;
  };
  dirty?: boolean;
};

export function InvitationPublicLink({ event, dirty = false }: Props) {
  const href = isInvitationPublished(event) ? invitationPath(event) : null;

  if (href) return <a
    className="editor-preview-public"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Abrir invitación pública"
    title={dirty ? "Abrir invitación pública. Muestra la última versión guardada; guarda tus cambios para actualizarla." : "Abrir invitación pública con su enlace para compartir"}
  ><FiExternalLink aria-hidden="true" /></a>;

  const reason = !event.paidAt && !event.complimentaryAt ? "El enlace público se habilita al confirmar el pago."
    : event.status === "SUSPENDED" ? "El enlace público está suspendido."
    : event.status === "REFUNDED" ? "El enlace público fue retirado por reembolso."
    : event.status === "ARCHIVED" ? "Esta invitación está archivada."
    : event.expiresAt && event.expiresAt <= new Date() ? "El enlace público está fuera de vigencia."
    : "El enlace público estará disponible cuando la invitación esté publicada.";

  return <button className="editor-preview-public" type="button" disabled aria-label={`Enlace público no disponible. ${reason}`} title={reason}>
    <FiLock aria-hidden="true" />
  </button>;
}
