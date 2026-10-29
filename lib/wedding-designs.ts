import type { EditorValues, InviteSection, SectionType } from "./invitation-editor";
import type { InvitationButtonAppearance } from "./invitation-buttons";
import { templateManifest } from "./generated-invitation-templates";
import { weddingIdentityAssets } from "./wedding-identity-assets";

export type WeddingPalette = { label: string; accent: string; paper: string; panel: string; ink: string; muted: string; dark: string };
export type WeddingDesign = {
  edition?: 2;
  concept?: string;
  id: string; label: string; description: string; kind: "floral" | "editorial" | "minimal" | "garden" | "blossom" | "bougainvillea" | "sunlight" | "olive" | "mediterranean" | "art-deco" | "love-letter" | "starlight";
  artwork?: "plantilla1" | "plantilla2" | "plantilla3" | "plantilla4" | "plantilla5" | "plantilla6" | "plantilla7" | "plantilla8";
  typography: string; bodyTypography: string; buttons: InvitationButtonAppearance; palettes: WeddingPalette[];
  texture?: string;
  foil?: string;
  celestial?: { sky: string; nebula: string; moon: string };
};

// Versioned identities keep existing invitations independent of future designs.
export const legacyWeddingDesigns: WeddingDesign[] = [
  {
    id: "wedding-floral-v1", label: "Floral romántico", kind: "floral", artwork: "plantilla5",
    texture: "/textures/wedding/cotton.webp",
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
    texture: "/textures/wedding/cotton.webp",
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
    texture: "/textures/wedding/cotton.webp",
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
    texture: "/textures/wedding/paper.webp",
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
    texture: "/textures/wedding/paper.webp",
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
    texture: "/textures/wedding/cotton.webp",
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
    texture: "/textures/wedding/linen.webp",
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
  {
    id: "wedding-mediterranean-v1", label: "Costa mediterránea", kind: "mediterranean", artwork: "plantilla7",
    description: "Azulejos azules, limones en acuarela y la luz de una celebración junto al mar.",
    typography: "eb-garamond", bodyTypography: "dm-sans",
    buttons: { shape: "square", filled: false, border: true, icons: true, bold: false },
    palettes: [
      { label: "Azul cerámica", accent: "#24577A", paper: "#FFFEF9", panel: "#EDF3F5", ink: "#243A48", muted: "#526675", dark: "#193F59" },
      { label: "Mar Egeo", accent: "#2D627E", paper: "#FCFDFC", panel: "#E7F0F3", ink: "#233D4A", muted: "#506976", dark: "#1E455A" },
      { label: "Limón y arena", accent: "#6E622B", paper: "#FFFCF2", panel: "#F3EDDA", ink: "#383622", muted: "#666249", dark: "#444323" },
      { label: "Riviera", accent: "#386B6B", paper: "#FBFEFC", panel: "#E6F0EB", ink: "#283E3A", muted: "#536A62", dark: "#254A43" },
      { label: "Cobalto", accent: "#304F83", paper: "#FEFDFA", panel: "#EAEFF6", ink: "#29384F", muted: "#56667C", dark: "#243B64" },
      { label: "Azul y terracota", accent: "#94543D", paper: "#FFFBF6", panel: "#F3E9DF", ink: "#3E322C", muted: "#735E52", dark: "#51392E" },
    ],
  },
  {
    id: "wedding-art-deco-v1", label: "Art Déco", kind: "art-deco",
    description: "Oro sobre ónix, abanicos geométricos y una celebración con el encanto de los años veinte.",
    typography: "cinzel", bodyTypography: "raleway",
    foil: "/textures/wedding/gold-leaf.jpg",
    buttons: { shape: "square", filled: false, border: true, icons: true, bold: false },
    palettes: [
      {
            "label": "Oro y ónix",
            "accent": "#DFC38A",
            "paper": "#101115",
            "panel": "#1B1D23",
            "ink": "#FAF3E5",
            "muted": "#C8BEAC",
            "dark": "#090A0D"
      },
      {
            "label": "Champaña",
            "accent": "#E6CFA8",
            "paper": "#181513",
            "panel": "#25211E",
            "ink": "#FFF5E7",
            "muted": "#CEC1AF",
            "dark": "#100D0B"
      },
      {
            "label": "Esmeralda nocturna",
            "accent": "#D8CA93",
            "paper": "#101B18",
            "panel": "#1B2A24",
            "ink": "#F5F3E5",
            "muted": "#B8C7BA",
            "dark": "#09120F"
      },
      {
            "label": "Zafiro",
            "accent": "#D5C49F",
            "paper": "#101722",
            "panel": "#1B2636",
            "ink": "#F5F1E8",
            "muted": "#BBC5D0",
            "dark": "#090E17"
      },
      {
            "label": "Borgoña",
            "accent": "#E3C096",
            "paper": "#201116",
            "panel": "#302029",
            "ink": "#FCF0E6",
            "muted": "#D0BAC0",
            "dark": "#160A0F"
      },
      {
            "label": "Plata y carbón",
            "accent": "#CFD2DB",
            "paper": "#15161B",
            "panel": "#22242D",
            "ink": "#F3F1F5",
            "muted": "#C2C2CC",
            "dark": "#0D0E12"
      }
],
  },
  {
    id: "wedding-love-letter-v1", label: "Carta de amor", kind: "love-letter", artwork: "plantilla8",
    description: "Una carta manuscrita, papel antiguo y un sello de cera que guarda su historia.",
    typography: "alex-brush", bodyTypography: "libre-baskerville",
    buttons: { shape: "square", filled: false, border: true, icons: true, bold: false },
    palettes: [
      {
            "label": "Tinta de vino",
            "accent": "#873C3E",
            "paper": "#FFF9EC",
            "panel": "#EAE0CE",
            "ink": "#49342D",
            "muted": "#75604D",
            "dark": "#4B302A"
      },
      {
            "label": "Rosa antiguo",
            "accent": "#8B4B54",
            "paper": "#FFFAF2",
            "panel": "#EEE1D6",
            "ink": "#4D3635",
            "muted": "#755C53",
            "dark": "#523538"
      },
      {
            "label": "Sepia",
            "accent": "#76513A",
            "paper": "#FFFAEE",
            "panel": "#EAE0CD",
            "ink": "#42342A",
            "muted": "#6D604E",
            "dark": "#48352A"
      },
      {
            "label": "Ciruela",
            "accent": "#76506A",
            "paper": "#FFFAF3",
            "panel": "#E9DFDA",
            "ink": "#44313E",
            "muted": "#705966",
            "dark": "#482E40"
      },
      {
            "label": "Oliva de época",
            "accent": "#596340",
            "paper": "#FFFCF0",
            "panel": "#E6E3D0",
            "ink": "#353B29",
            "muted": "#60654D",
            "dark": "#39412D"
      },
      {
            "label": "Azul de tinta",
            "accent": "#4F6175",
            "paper": "#FFFBF3",
            "panel": "#E2E3E1",
            "ink": "#303B47",
            "muted": "#56606A",
            "dark": "#344052"
      }
],
  },
  {
    id: "wedding-starlight-v1", label: "Bajo las estrellas", kind: "starlight",
    description: "Azul noche, una luna dorada y constelaciones que acompañan el comienzo de su historia.",
    typography: "cormorant-garamond", bodyTypography: "manrope",
    celestial: { sky: "/celestial/night-sky.jpg", nebula: "/celestial/golden-nebula.jpg", moon: "/celestial/full-moon.png" },
    buttons: { shape: "rounded", filled: false, border: true, icons: true, bold: false },
    palettes: [
      {
            "label": "Noche y oro suave",
            "accent": "#C6A75E",
            "paper": "#131E35",
            "panel": "#1F2A44",
            "ink": "#E8DCC8",
            "muted": "#C3C7D1",
            "dark": "#0B1222"
      },
      {
            "label": "Luz de luna",
            "accent": "#D6DEEB",
            "paper": "#151F34",
            "panel": "#232F46",
            "ink": "#F0E9DD",
            "muted": "#C1CAD8",
            "dark": "#0C1425"
      },
      {
            "label": "Azul profundo",
            "accent": "#D8C295",
            "paper": "#0F2138",
            "panel": "#1B324B",
            "ink": "#F4EAD8",
            "muted": "#BAC8D5",
            "dark": "#081729"
      },
      {
            "label": "Noche amatista",
            "accent": "#D7BFA1",
            "paper": "#231C36",
            "panel": "#332B48",
            "ink": "#F6EADB",
            "muted": "#CDC0D4",
            "dark": "#161021"
      },
      {
            "label": "Aurora",
            "accent": "#B9D8C9",
            "paper": "#102A2B",
            "panel": "#1C3B3B",
            "ink": "#F3EAD9",
            "muted": "#B9CCC6",
            "dark": "#091B1D"
      },
      {
            "label": "Cielo de champaña",
            "accent": "#E0C6A2",
            "paper": "#252333",
            "panel": "#363246",
            "ink": "#FAEEDF",
            "muted": "#CFC4D3",
            "dark": "#171522"
      }
],
  },
];

// New compositions have separate identities; saved invitations keep their v1 renderer.
const identities: Record<WeddingDesign["kind"], { concept: string; description: string }> = {
  floral: { concept: "El jardín de nuestro sí", description: "Un arco botánico, flores blancas y un jardín que acompaña cada capítulo." },
  editorial: { concept: "Una edición para siempre", description: "Una portada de revista, fotografías amplias y capítulos de una historia irrepetible." },
  minimal: { concept: "Lo esencial eres tú", description: "Papelería marfil, caligrafía delicada y un hilo que une los momentos del día." },
  garden: { concept: "Una cita entre flores", description: "Papelería violeta, un calendario y acuarelas que florecen entre sus recuerdos." },
  blossom: { concept: "Donde florece el amor", description: "Ramas de cerezo, retratos redondos y pétalos sobre una delicada página de primavera." },
  bougainvillea: { concept: "Amor de hacienda", description: "Un álbum de recuerdos, flores intensas y tarjetas de papel sobre un fondo de vino." },
  sunlight: { concept: "Un día lleno de luz", description: "Flores doradas, bordes ondulados y recuerdos de una celebración bajo el sol." },
  olive: { concept: "Raíces de nuestro amor", description: "Lino, ramas de olivo y fotografías impresas entre páginas de papelería natural." },
  mediterranean: { concept: "Una postal para ustedes", description: "Una postal de la costa, azulejos, limones y detalles de un viaje para celebrar." },
  "art-deco": { concept: "Una noche extraordinaria", description: "Una invitación de gala con marcos geométricos, papel oscuro y oro discreto." },
  "love-letter": { concept: "Escrito con el corazón", description: "Un sobre abierto, un sello de cera y una carta que continúa en cada recuerdo." },
  starlight: { concept: "El universo nos encontró", description: "Luna, órbitas y constelaciones que trazan los momentos de una noche inolvidable." },
};

export const weddingDesigns: WeddingDesign[] = legacyWeddingDesigns.map(design => ({
  ...design, id: design.id.replace(/-v1$/, "-v2"), edition: 2, ...identities[design.kind],
  ...(design.kind === "minimal" ? { typography: "cormorant-garamond", bodyTypography: "lora" } : {}),
  ...(design.kind === "sunlight" || design.kind === "blossom" ? { bodyTypography: "lora" } : {}),
  ...(design.kind === "bougainvillea" ? { typography: "eb-garamond", bodyTypography: "libre-baskerville" } : {}),
}));

export function getWeddingDesign(id: string) { return weddingDesigns.find(design => design.id === id) ?? legacyWeddingDesigns.find(design => design.id === id) ?? null; }
export function weddingArtwork(design: WeddingDesign): Partial<Record<"topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "flower" | "decoration" | "texture", string>> {
  const assets = templateManifest.find(template => template.eventType === "wedding" && template.id === design.artwork && template.available)?.assets ?? {};
  return { ...assets, ...(design.texture ? { texture: design.texture } : {}), ...(design.edition === 2 ? weddingIdentityAssets[design.kind] : {}) };
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
