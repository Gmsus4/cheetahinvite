export type InvitationButtonAppearance = {
  shape: "square" | "rounded" | "pill";
  filled: boolean;
  icons: boolean;
  border: boolean;
  bold: boolean;
};
export const defaultButtonAppearance: InvitationButtonAppearance = { shape: "square", filled: true, icons: true, border: false, bold: true };
export function eventButtonAppearance(event: { buttonShape?: string; buttonFilled?: boolean; buttonIcons?: boolean; buttonBorder?: boolean; buttonBold?: boolean }): InvitationButtonAppearance {
  return {
    shape: event.buttonShape === "rounded" || event.buttonShape === "pill" ? event.buttonShape : "square",
    filled: event.buttonFilled ?? true,
    icons: event.buttonIcons ?? true,
    border: event.buttonBorder ?? false,
    bold: event.buttonBold ?? true,
  };
}
export function parseButtonAppearance(form: FormData): InvitationButtonAppearance | null {
  const shape = form.get("buttonShape") ?? "square";
  const filled = form.get("buttonFilled") ?? "true";
  const icons = form.get("buttonIcons") ?? "true";
  const border = form.get("buttonBorder") ?? "false";
  const bold = form.get("buttonBold") ?? "true";
  if (!["square", "rounded", "pill"].includes(String(shape)) || [filled, icons, border, bold].some((value) => value !== "true" && value !== "false")) return null;
  return { shape: shape as InvitationButtonAppearance["shape"], filled: filled === "true", icons: icons === "true", border: border === "true", bold: bold === "true" };
}
