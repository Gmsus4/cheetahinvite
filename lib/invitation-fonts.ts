export const invitationFonts = [
  {
    "id": "default",
    "label": "Original del diseño · Poppins",
    "family": "'Poppins', Arial, sans-serif"
  },
  {
    "id": "georgia",
    "label": "Georgia",
    "family": "Georgia, 'Times New Roman', serif"
  },
  {
    "id": "alex-brush",
    "label": "Alex Brush",
    "family": "'Alex Brush', Arial, sans-serif"
  },
  {
    "id": "baloo-2",
    "label": "Baloo 2",
    "family": "'Baloo 2 Variable', Arial, sans-serif"
  },
  {
    "id": "caveat",
    "label": "Caveat",
    "family": "'Caveat Variable', Arial, sans-serif"
  },
  {
    "id": "cinzel",
    "label": "Cinzel",
    "family": "'Cinzel Variable', Georgia, serif"
  },
  {
    "id": "comfortaa",
    "label": "Comfortaa",
    "family": "'Comfortaa Variable', Arial, sans-serif"
  },
  {
    "id": "cormorant-garamond",
    "label": "Cormorant Garamond",
    "family": "'Cormorant Garamond Variable', Georgia, serif"
  },
  {
    "id": "dancing-script",
    "label": "Dancing Script",
    "family": "'Dancing Script Variable', Arial, sans-serif"
  },
  {
    "id": "dm-sans",
    "label": "DM Sans",
    "family": "'DM Sans Variable', Arial, sans-serif"
  },
  {
    "id": "eb-garamond",
    "label": "EB Garamond",
    "family": "'EB Garamond Variable', Georgia, serif"
  },
  {
    "id": "fredoka",
    "label": "Fredoka",
    "family": "'Fredoka Variable', Arial, sans-serif"
  },
  {
    "id": "great-vibes",
    "label": "Great Vibes",
    "family": "'Great Vibes', Arial, sans-serif"
  },
  {
    "id": "inter",
    "label": "Inter",
    "family": "'Inter Variable', Arial, sans-serif"
  },
  {
    "id": "libre-baskerville",
    "label": "Libre Baskerville",
    "family": "'Libre Baskerville Variable', Georgia, serif"
  },
  {
    "id": "lilita-one",
    "label": "Lilita One",
    "family": "'Lilita One', Arial, sans-serif"
  },
  {
    "id": "lora",
    "label": "Lora",
    "family": "'Lora Variable', Georgia, serif"
  },
  {
    "id": "manrope",
    "label": "Manrope",
    "family": "'Manrope Variable', Arial, sans-serif"
  },
  {
    "id": "montserrat",
    "label": "Montserrat",
    "family": "'Montserrat Variable', Arial, sans-serif"
  },
  {
    "id": "nunito",
    "label": "Nunito",
    "family": "'Nunito Variable', Arial, sans-serif"
  },
  {
    "id": "outfit",
    "label": "Outfit",
    "family": "'Outfit Variable', Arial, sans-serif"
  },
  {
    "id": "pacifico",
    "label": "Pacifico",
    "family": "'Pacifico', Arial, sans-serif"
  },
  {
    "id": "playfair-display",
    "label": "Playfair Display",
    "family": "'Playfair Display Variable', Georgia, serif"
  },
  {
    "id": "poppins",
    "label": "Poppins",
    "family": "'Poppins', Arial, sans-serif"
  },
  {
    "id": "quicksand",
    "label": "Quicksand",
    "family": "'Quicksand Variable', Arial, sans-serif"
  },
  {
    "id": "raleway",
    "label": "Raleway",
    "family": "'Raleway Variable', Arial, sans-serif"
  }
] as const;

export function getInvitationFont(id: string) {
  return invitationFonts.find((font) => font.id === id) ?? invitationFonts[0];
}

export function isInvitationFont(id: string) {
  return invitationFonts.some((font) => font.id === id);
}

export type FontRole = "heading" | "body";
const recommendations: Record<string, Record<FontRole, string[]>> = {
  wedding: { heading: ["cormorant-garamond", "playfair-display", "great-vibes", "alex-brush", "eb-garamond"], body: ["inter", "montserrat", "lora", "nunito", "poppins"] },
  birthday: { heading: ["fredoka", "baloo-2", "lilita-one", "pacifico", "caveat"], body: ["nunito", "quicksand", "poppins", "dm-sans", "inter"] },
  graduation: { heading: ["cinzel", "libre-baskerville", "montserrat", "raleway", "playfair-display"], body: ["inter", "poppins", "dm-sans", "manrope", "lora"] },
  baby_shower: { heading: ["nunito", "quicksand", "comfortaa", "lora", "caveat"], body: ["nunito", "quicksand", "inter", "dm-sans", "poppins"] },
  anniversary: { heading: ["playfair-display", "cormorant-garamond", "dancing-script", "great-vibes", "lora"], body: ["lora", "inter", "montserrat", "nunito", "poppins"] },
  other: { heading: ["poppins", "montserrat", "dm-sans", "manrope", "outfit"], body: ["inter", "dm-sans", "manrope", "nunito", "poppins"] },
};

export function recommendedInvitationFonts(eventType: string, role: FontRole) {
  return (recommendations[eventType] ?? recommendations.other)[role];
}
