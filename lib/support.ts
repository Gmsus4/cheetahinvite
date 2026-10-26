export const SUPPORT_EMAIL = "cheetahinvite@gmail.com";
export const supportReasons = [
  "Me cobraron, pero no se publicó mi invitación",
  "Creo que pagué dos veces",
  "No puedo editar o abrir mi invitación",
  "Quiero solicitar un reembolso",
  "Otra consulta",
] as const;

export function supportMailto({ email = "", eventId = "", eventName = "", reason = "Otra consulta", message = "" }: {
  email?: string; eventId?: string; eventName?: string; reason?: string; message?: string;
} = {}) {
  const body = [
    "Hola, equipo de Cheetah Invite:", "",
    `Motivo: ${reason}`,
    `Correo de mi cuenta: ${email.trim() || "[escribe el correo de tu cuenta]"}`,
    `Referencia de la invitación: ${eventId || "[si la tienes]"}`,
    ...(eventName ? [`Nombre de la invitación: ${eventName}`] : []),
    "", "Descripción del problema:", message.trim() || "[cuéntanos qué ocurrió y cuándo]", "",
    "Gracias.",
  ].join("\n");
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Ayuda con mi invitación — ${reason}`)}&body=${encodeURIComponent(body)}`;
}
