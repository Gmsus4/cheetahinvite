export const invitationCoverLayouts = [
  { value: "split", label: "Foto a la derecha", description: "Nombres a la izquierda y foto a la derecha. En móvil, el texto aparece primero." },
  { value: "split-reverse", label: "Foto a la izquierda", description: "Foto a la izquierda y nombres a la derecha. En móvil, la foto aparece primero." },
  { value: "stacked", label: "Portada centrada", description: "Nombres centrados, una foto amplia y la cuenta regresiva debajo." },
  { value: "overlay", label: "Texto sobre la foto", description: "La foto ocupa la portada, con los nombres y la cuenta regresiva encima." },
] as const;

export type InvitationCoverLayout = typeof invitationCoverLayouts[number]["value"];

export function isInvitationCoverLayout(value: unknown): value is InvitationCoverLayout {
  return typeof value === "string" && invitationCoverLayouts.some(option => option.value === value);
}
