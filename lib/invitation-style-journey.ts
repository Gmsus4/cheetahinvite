export const invitationStyleSteps = [
  { id: "corners", label: "Esquinas" },
  { id: "icons", label: "Iconos" },
  { id: "surface", label: "Acabado" },
  { id: "colors", label: "Colores" },
  { id: "fonts", label: "Letras" },
] as const;

export function invitationStyleStepIndex(value: string | null | undefined) {
  return Math.max(0, invitationStyleSteps.findIndex(step => `style:${step.id}` === value));
}

export const invitationSurfaceOptions = [
  { value: "auto", label: "Automático", description: "Combina los acabados de cada sección." },
  { value: "blur", label: "Desenfoque", description: "Un fondo suave y translúcido." },
  { value: "blur-color", label: "Desenfoque con color", description: "Transparencia con tu color temático." },
  { value: "color", label: "Color sólido", description: "Tu color temático, sin transparencia." },
  { value: "glass", label: "Cristal", description: "Transparencia ligera y reflejos discretos." },
] as const;
