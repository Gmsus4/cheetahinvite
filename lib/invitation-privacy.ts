export type InvitationPrivacy = "UNSET" | "PUBLIC" | "PRIVATE";

export function isInvitationPrivacy(value: unknown): value is InvitationPrivacy {
  return value === "UNSET" || value === "PUBLIC" || value === "PRIVATE";
}

export function invitationPrivacyIssue(privacy: InvitationPrivacy, pin: string, pinPending: boolean, hasPin: boolean): string | null {
  if (privacy === "UNSET") return "Elige si tu invitación será pública o protegida con PIN.";
  if (privacy === "PRIVATE" && (pinPending || pin !== "" || !hasPin) && !/^\d{6}$/.test(pin)) return "Escribe o genera un PIN de seis dígitos para proteger la invitación.";
  return null;
}

/** Keep the selection in device backups, but never a guest access PIN. */
export function redactEditorPin(snapshot: string, acknowledged: string): string {
  const values = JSON.parse(snapshot);
  if (!values.pin) return snapshot;
  const saved = JSON.parse(acknowledged);
  return JSON.stringify({ ...values, pin: "", pinPending: values.pin !== saved.pin });
}
