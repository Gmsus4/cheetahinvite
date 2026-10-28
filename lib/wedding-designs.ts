import type { EditorValues, InviteSection, SectionType } from "./invitation-editor";
import type { InvitationButtonAppearance } from "./invitation-buttons";
import { templateManifest } from "./generated-invitation-templates";

export type WeddingPalette = { label: string; accent: string; paper: string; panel: string; ink: string; muted: string; dark: string };
export type WeddingDesign = {
  id: string; label: string; description: string; kind: "floral" | "editorial" | "minimal" | "garden" | "blossom" | "bougainvillea" | "sunlight" | "olive";
  artwork?: "plantilla1" | "plantilla2" | "plantilla3" | "plantilla4" | "plantilla5" | "plantilla6";
  typography: string; bodyTypography: string; buttons: InvitationButtonAppearance; palettes: WeddingPalette[];
};

// Versioned identities keep existing invitations independent of future designs.
export const weddingDesigns: WeddingDesign[] = [
  {
    id: "wedding-floral-v1", label: "Floral romántico", kind: "floral", artwork: "plantilla5",
    description: "Flores delicadas, letras con encanto y una celebración llena de calidez.",
    typography: "great-vibes", bodyTypography: "lora",
    buttons: { shape: "pill", filled: true, border: false, icons: true, bold: false },
    palettes: [
      { label: "Olivo y marfil", accent: "#58664E", paper: "#FCFAF5", panel: "#EEEFE5", ink: "#2D382B", muted: "#606655", dark: "#303D2D" },
      { label: "Rosa antiguo", accent: "#925C65", paper: "#FFF9F7", panel: "#F3E5E4", ink: "#482E36", muted: "#785B62", dark: "#583B43" },
      { label: "Lavanda", accent: "#765B89", paper: "#FCF9FE", panel: "#EEE7F4", ink: "#392D46", muted: "#6F6079", dark: "#453450" },
      { label: "Champaña", accent: "#806640", paper: "#FFFCF5", panel: "#F2EBDC", ink: "#3C3223", muted: "#71634F", dark: "#493B28" },
      { label: "Eucalipto", accent: "#486D66", paper: "#F8FCFA", panel: "#E4EEEA", ink: "#263D37", muted: "#536B62", dark: "#2C4840" },
      { label: "Azul polvo", accent: "#536D86", paper: "#FAFBFE", panel: "#E7EDF3", ink: "#2B3849", muted: "#566779", dark: "#304458" },
    ],
  },
  {
    id: "wedding-editorial-v1", label: "Editorial elegante", kind: "editorial",
    description: "Fotografías protagonistas y una composición inspirada en una revista.",
    typography: "cormorant-garamond", bodyTypography: "dm-sans",
    buttons: { shape: "square", filled: true, border: false, icons: false, bold: true },
    palettes: [
      { label: "Terracota", accent: "#984A36", paper: "#F8F3EC", panel: "#EBDCD0", ink: "#302823", muted: "#705E54", dark: "#462F28" },
      { label: "Azul noche", accent: "#405C73", paper: "#F7F7F2", panel: "#E1E7EA", ink: "#233442", muted: "#576875", dark: "#243847" },
      { label: "Vino", accent: "#823E4C", paper: "#FCF5F1", panel: "#EEDCE0", ink: "#40282F", muted: "#765B62", dark: "#4A2933" },
      { label: "Oliva profundo", accent: "#586044", paper: "#FAF9F0", panel: "#E9E9D9", ink: "#2C3123", muted: "#60634D", dark: "#353B29" },
      { label: "Carbón y hueso", accent: "#4A4C50", paper: "#F9F7F2", panel: "#E9E6E0", ink: "#292A2C", muted: "#63615D", dark: "#2E3034" },
      { label: "Cobre", accent: "#925638", paper: "#FFF9F0", panel: "#F0DFCB", ink: "#422E22", muted: "#775E49", dark: "#503625" },
    ],
  },
  {
    id: "wedding-minimal-v1", label: "Minimalista", kind: "minimal",
    description: "Líneas limpias, mucho aire y belleza en los detalles más sencillos.",
    typography: "playfair-display", bodyTypography: "inter",
    buttons: { shape: "rounded", filled: false, border: true, icons: false, bold: false },
    palettes: [
      { label: "Arena", accent: "#736048", paper: "#FEFCF8", panel: "#F1ECE3", ink: "#332E27", muted: "#6C6357", dark: "#38332C" },
      { label: "Salvia", accent: "#486458", paper: "#FAFCF9", panel: "#E9EFE8", ink: "#273B32", muted: "#5C6E61", dark: "#2D4237" },
      { label: "Grafito", accent: "#55565C", paper: "#FCFCFC", panel: "#EBEBEE", ink: "#29292E", muted: "#62626B", dark: "#303037" },
      { label: "Rosa de té", accent: "#8A5961", paper: "#FFFBFA", panel: "#F2E7E7", ink: "#423033", muted: "#755D62", dark: "#50373E" },
      { label: "Azul pizarra", accent: "#526B7A", paper: "#FBFCFD", panel: "#E8EEF0", ink: "#293A42", muted: "#5B6B73", dark: "#314650" },
      { label: "Cacao", accent: "#715A4C", paper: "#FEFCFA", panel: "#EEE8E1", ink: "#362D27", muted: "#6C6056", dark: "#43362D" },
    ],
  },
  {
    id: "wedding-garden-v1", label: "Jardín de azafrán", kind: "garden", artwork: "plantilla1",
    description: "Acuarelas violetas, un marco delicado y el encanto de una carta de amor.",
    typography: "alex-brush", bodyTypography: "libre-baskerville",
    buttons: { shape: "rounded", filled: true, border: false, icons: true, bold: false },
    palettes: [
      { label: "Azafrán violeta", accent: "#77518A", paper: "#FBF8FC", panel: "#EDE4F1", ink: "#392A42", muted: "#6D5876", dark: "#46314F" },
      { label: "Ciruela suave", accent: "#684463", paper: "#FCF8FB", panel: "#EDE2E9", ink: "#382634", muted: "#6B5464", dark: "#492F43" },
      { label: "Jardín de salvia", accent: "#5A6D55", paper: "#FAFBF5", panel: "#E6EBDE", ink: "#303C2B", muted: "#5C6854", dark: "#37462F" },
      { label: "Mora y lino", accent: "#5E4A75", paper: "#FAF8FC", panel: "#E8E3EF", ink: "#30273E", muted: "#62576E", dark: "#3D3051" },
      { label: "Lavanda gris", accent: "#666078", paper: "#FBFAFD", panel: "#EAE7F0", ink: "#32303F", muted: "#635E70", dark: "#403B50" },
      { label: "Vino rosado", accent: "#7F4E66", paper: "#FFF9FB", panel: "#F0E2E8", ink: "#3E2A35", muted: "#715764", dark: "#503343" },
    ],
  },
  {
    id: "wedding-blossom-v1", label: "Flor de cerezo", kind: "blossom", artwork: "plantilla2",
    description: "Ramas de cerezo, un retrato redondo y capítulos suaves en tonos de primavera.",
    typography: "dancing-script", bodyTypography: "quicksand",
    buttons: { shape: "pill", filled: true, border: false, icons: true, bold: true },
    palettes: [
      { label: "Cerezo en flor", accent: "#A83D68", paper: "#FFF9FB", panel: "#F7E3EC", ink: "#482B39", muted: "#795462", dark: "#5C3045" },
      { label: "Rosa empolvado", accent: "#975263", paper: "#FFFAF8", panel: "#F1E3E4", ink: "#442E34", muted: "#765963", dark: "#553743" },
      { label: "Borgoña", accent: "#793F52", paper: "#FFF9FA", panel: "#EDDFE4", ink: "#3C2630", muted: "#70545E", dark: "#4E2C3A" },
      { label: "Té verde", accent: "#586C54", paper: "#FCFCF6", panel: "#E8EDDF", ink: "#303A2B", muted: "#5F6955", dark: "#39462F" },
      { label: "Malva", accent: "#855B84", paper: "#FFF9FE", panel: "#EFE3EF", ink: "#402D40", muted: "#715971", dark: "#513651" },
      { label: "Durazno", accent: "#985C4A", paper: "#FFFAF5", panel: "#F5E5DB", ink: "#472E27", muted: "#785B50", dark: "#593B30" },
    ],
  },
  {
    id: "wedding-bougainvillea-v1", label: "Bugambilias", kind: "bougainvillea", artwork: "plantilla3",
    description: "Flores vibrantes, un retrato en arco y una portada con mucha personalidad.",
    typography: "cinzel", bodyTypography: "montserrat",
    buttons: { shape: "square", filled: true, border: false, icons: true, bold: true },
    palettes: [
      { label: "Bugambilia", accent: "#9E2467", paper: "#FFFAFD", panel: "#F6E0ED", ink: "#432137", muted: "#765269", dark: "#52223F" },
      { label: "Guayaba", accent: "#A04C50", paper: "#FFFAF8", panel: "#F6E2DF", ink: "#49292D", muted: "#7C565B", dark: "#5B3039" },
      { label: "Violeta intenso", accent: "#674B8A", paper: "#FCF9FF", panel: "#ECE2F4", ink: "#34253F", muted: "#665374", dark: "#422C55" },
      { label: "Ciruela profunda", accent: "#652E58", paper: "#FDF9FD", panel: "#EDE0EC", ink: "#352332", muted: "#6D5266", dark: "#47263F" },
      { label: "Noche azul", accent: "#3C4567", paper: "#FAFBFF", panel: "#E4E7F1", ink: "#262C40", muted: "#545F78", dark: "#2D3451" },
      { label: "Frambuesa", accent: "#962E49", paper: "#FFFAFB", panel: "#F3DEE4", ink: "#432530", muted: "#76505D", dark: "#542839" },
    ],
  },
  {
    id: "wedding-sunlight-v1", label: "Flores amarillas", kind: "sunlight", artwork: "plantilla4",
    description: "Flores doradas, mariposas y una composición luminosa para celebrar al aire libre.",
    typography: "eb-garamond", bodyTypography: "nunito",
    buttons: { shape: "rounded", filled: true, border: false, icons: true, bold: true },
    palettes: [
      { label: "Miel y crema", accent: "#84611E", paper: "#FFFCF3", panel: "#F5EBCB", ink: "#3B3020", muted: "#6E6043", dark: "#493B21" },
      { label: "Olivo al sol", accent: "#5D683E", paper: "#FEFCF3", panel: "#EAEBD5", ink: "#323820", muted: "#616647", dark: "#3C4428" },
      { label: "Tierra cálida", accent: "#965337", paper: "#FFFAF2", panel: "#F3E3CF", ink: "#442D23", muted: "#745A48", dark: "#54372A" },
      { label: "Café y vainilla", accent: "#6D513A", paper: "#FFFCF6", panel: "#EEE4D4", ink: "#382B20", muted: "#6C5D4B", dark: "#463424" },
      { label: "Ámbar", accent: "#935D1B", paper: "#FFFCF4", panel: "#F5E6C8", ink: "#412F1C", muted: "#715C3C", dark: "#513A20" },
      { label: "Bosque y oro", accent: "#476447", paper: "#FBFCF3", panel: "#E4EAD6", ink: "#293A29", muted: "#57664D", dark: "#32472E" },
    ],
  },
  {
    id: "wedding-olive-v1", label: "Olivo y lino", kind: "olive", artwork: "plantilla6",
    description: "Ramas de olivo, lino natural y una fotografía como un recuerdo impreso.",
    typography: "cormorant-garamond", bodyTypography: "lora",
    buttons: { shape: "rounded", filled: true, border: false, icons: true, bold: false },
    palettes: [
      { label: "Olivo y marfil", accent: "#526348", paper: "#FAF7ED", panel: "#EBEADC", ink: "#2E3726", muted: "#59634E", dark: "#34402D" },
      { label: "Salvia y crema", accent: "#596F58", paper: "#FAFBF4", panel: "#E7EDDD", ink: "#293A28", muted: "#5B6851", dark: "#354A31" },
      { label: "Arena natural", accent: "#79634A", paper: "#FFFBF3", panel: "#EFE5D4", ink: "#3C3227", muted: "#6D604E", dark: "#493C2C" },
      { label: "Olivo y terracota", accent: "#925B40", paper: "#FFF9EF", panel: "#F0E2CD", ink: "#402F25", muted: "#715B47", dark: "#4E3829" },
      { label: "Eucalipto y lino", accent: "#46685D", paper: "#F8FAF1", panel: "#E2EADF", ink: "#293D32", muted: "#546656", dark: "#314A3C" },
      { label: "Bosque profundo", accent: "#3F5440", paper: "#FAFAF2", panel: "#E4E8D9", ink: "#283528", muted: "#56624C", dark: "#2C3D2D" },
    ],
  },
];

export function getWeddingDesign(id: string) { return weddingDesigns.find(design => design.id === id) ?? null; }
export function weddingArtwork(design: WeddingDesign): Partial<Record<"topLeft" | "bottomRight" | "flower" | "decoration" | "texture", string>> {
  return templateManifest.find(template => template.eventType === "wedding" && template.id === design.artwork && template.available)?.assets ?? {};
}
export function weddingPalette(design: WeddingDesign, accent: string) {
  return design.palettes.find(palette => palette.accent.toLowerCase() === accent.toLowerCase()) ?? design.palettes[0];
}

export const weddingDetails: { type: SectionType; title: string; question: string; help: string }[] = [
  { type: "story", title: "Nuestra historia", question: "¿Quieren contar su historia?", help: "Unas palabras sobre ustedes y cómo llegaron hasta aquí." },
  { type: "ceremony", title: "Ceremonia", question: "¿La ceremonia será en otro lugar?", help: "Agrega aquí el lugar y horario si son distintos a la celebración principal." },
  { type: "reception", title: "Recepción", question: "¿Habrá recepción en otro lugar?", help: "Comparte los datos del segundo lugar de la celebración." },
  { type: "program", title: "Itinerario", question: "¿Quieren compartir el itinerario?", help: "Ayuda a tus invitados a conocer los momentos del día." },
  { type: "parents", title: "Nuestras familias", question: "¿Quieren mencionar a sus familias?", help: "Un espacio para padres o personas especiales." },
  { type: "dress_code", title: "Código de vestimenta", question: "¿Habrá código de vestimenta?", help: "Comparte el estilo de ropa y cualquier recomendación." },
  { type: "gifts", title: "Regalos", question: "¿Tendrán mesa de regalos o lluvia de sobres?", help: "Incluye un mensaje y, si tienes, un enlace a la mesa de regalos." },
  { type: "gallery", title: "Nuestros momentos", question: "¿Quieren incluir más fotografías?", help: "Una galería con sus recuerdos favoritos." },
  { type: "rsvp", title: "¿Nos acompañas?", question: "¿Quieren recibir confirmaciones?", help: "Sus invitados podrán responder aquí o desde un enlace de WhatsApp." },
];

export function weddingSections(): InviteSection[] {
  return weddingDetails.map(detail => ({ id: `wedding-${detail.type}`, type: detail.type, title: detail.title,
    content: "", detail: "", link: "", imageUrl: "", imageUrls: [], enabled: detail.type === "rsvp",
    ...(detail.type === "rsvp" ? { rsvpMode: "integrated" as const } : {}),
  }));
}

export function orderedWeddingSections(sections: InviteSection[]) {
  return weddingDetails.flatMap(detail => sections.filter(section => section.type === detail.type));
}

export function applyWeddingDesign(values: EditorValues, id: string, accent?: string): EditorValues {
  const design = getWeddingDesign(id) ?? weddingDesigns[0];
  return { ...values, eventType: "wedding", templateId: design.id, accent: weddingPalette(design, accent ?? "").accent,
    typography: design.typography, bodyTypography: design.bodyTypography, texture: "none",
    heroHorizontal: "center", heroVertical: "center", buttonAppearance: { ...design.buttons },
    sections: orderedWeddingSections(values.sections).map(section => ({ ...section, layout: "auto" })),
  };
}

export function weddingPublicationIssues(values: Pick<EditorValues, "hostNames" | "eventDate" | "eventTime" | "venue" | "address" | "sections">) {
  const issues: { step: number; message: string }[] = [];
  if (!values.hostNames.trim()) issues.push({ step: 1, message: "Agrega los nombres de la pareja." });
  if (!values.eventDate) issues.push({ step: 1, message: "Elige la fecha de la boda." });
  if (!values.eventTime) issues.push({ step: 1, message: "Agrega la hora de la celebración." });
  if (!values.venue.trim()) issues.push({ step: 1, message: "Agrega el lugar de la celebración." });
  if (!values.address.trim()) issues.push({ step: 1, message: "Agrega la dirección para que tus invitados puedan llegar." });
  for (const section of values.sections.filter(section => section.enabled)) {
    if (section.type === "rsvp" && section.rsvpMode === "integrated") continue;
    const complete = section.type === "gallery" ? Boolean(section.imageUrls?.length || section.imageUrl)
      : section.type === "rsvp" ? Boolean(section.link.trim())
      : section.type === "ceremony" || section.type === "reception" ? Boolean(section.content.trim() && section.detail.trim() && section.link.trim())
      : Boolean(section.content.trim() || section.link.trim());
    if (!complete) issues.push({ step: 2, message: `Completa «${section.title}» o desactívala.` });
  }
  return issues;
}

export function weddingEventPublicationIssues(event: { eventType?: string; templateId?: string; hostNames?: string | null; eventDate?: Date | null; eventTime?: string | null; venue?: string | null; address?: string | null; sections?: unknown }) {
  if (event.eventType !== "wedding" || !getWeddingDesign(event.templateId ?? "")) return [];
  return weddingPublicationIssues({ hostNames: event.hostNames ?? "", eventDate: event.eventDate?.toISOString().slice(0, 10) ?? "", eventTime: event.eventTime ?? "", venue: event.venue ?? "", address: event.address ?? "", sections: (Array.isArray(event.sections) ? event.sections : []) as InviteSection[] });
}
