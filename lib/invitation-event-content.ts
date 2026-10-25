import type { InviteSection, SectionType } from "@/components/dashboard/EventEditor";

export const invitationEventTypes = ["wedding", "birthday", "graduation", "baby_shower", "anniversary", "other"] as const;
export type InvitationEventType = typeof invitationEventTypes[number];

type SectionCopy = { title: string; content: string; detail?: string };
type EventContent = {
  label: string;
  slug: string;
  defaultName: string;
  heroKicker: string;
  heroIntro: string;
  welcomeTitle: string;
  message: string;
  recommendedSections: SectionType[];
  sections: Record<SectionType, SectionCopy>;
  demo: {
    name: string; hostNames: string; date: string; eventTime: string;
    venue: string; address: string; accent: string; typography: string; bodyTypography: string;
  };
};

// Editorial examples only. Real names, dates and locations remain user input.
const eventContent: Record<InvitationEventType, EventContent> = {
  wedding: {
    label: "Boda", slug: "boda", defaultName: "Nuestra boda",
    heroKicker: "NOS CASAMOS", heroIntro: "Elegimos caminar juntos y queremos celebrarlo contigo",
    welcomeTitle: "Bienvenidos",
    message: "Hay días que se vuelven inolvidables cuando los compartimos con las personas que queremos. Nos encantará contar contigo en el comienzo de esta nueva etapa.",
    recommendedSections: ["story", "ceremony", "reception", "program", "parents", "dress_code", "gifts", "rsvp"],
    demo: { name: "Nuestra boda", hostNames: "Sofía y Mateo", date: "12 de octubre de 2027", eventTime: "17:00", venue: "Hacienda Las Nubes", address: "Oaxaca", accent: "#8c7258", typography: "great-vibes", bodyTypography: "inter" },
    sections: {
      story: { title: "Nuestra historia", content: "Entre conversaciones que se alargaban, viajes improvisados y pequeños momentos cotidianos, fuimos construyendo un hogar el uno en el otro. Hoy damos el siguiente paso con la alegría de tenerte cerca." },
      ceremony: { title: "El sí de nuestras vidas", content: "Nos daremos el sí en el jardín de Hacienda Las Nubes. Acompáñanos a compartir las promesas con las que comienza nuestra vida de casados.", detail: "5:00 p. m. · Ceremonia en el jardín" },
      reception: { title: "Una noche para brindar", content: "Después de la ceremonia nos esperan la cena, los abrazos y nuestra primera pista de baile como esposos. Queremos que esta noche también sea uno de tus recuerdos favoritos.", detail: "7:00 p. m. · Salón principal" },
      program: { title: "Así viviremos el día", content: "17:00 — Ceremonia\n18:00 — Cóctel y fotografías\n19:00 — Cena\n20:30 — Primer baile\n21:00 — ¡Todos a la pista!" },
      parents: { title: "Con el cariño de nuestras familias", content: "Ana Martínez y Carlos López\nLaura García y Miguel Hernández", detail: "Gracias por enseñarnos a construir un amor que se cuida cada día." },
      dress_code: { title: "Código de vestimenta", content: "Formal. Reserva el blanco para la novia y elige zapatos con los que puedas disfrutar del jardín y bailar toda la noche." },
      gifts: { title: "Un detalle para nuestro hogar", content: "Tu compañía es nuestro mejor regalo. Si quieres acompañar esta nueva etapa con un detalle, puedes preguntarnos por nuestra mesa de regalos." },
      rsvp: { title: "¿Nos acompañas?", content: "Nos hará muy felices compartir nuestra boda contigo. Confirma con nosotros antes del 28 de septiembre e indícanos quiénes te acompañarán y si tienes alguna restricción alimentaria." },
      gallery: { title: "Nuestros momentos", content: "Unas cuantas fotografías de todos esos días que nos trajeron hasta aquí.", detail: "Nuestra historia, un recuerdo a la vez." },
      music: { title: "La banda sonora de nuestra historia", content: "Hay canciones que nos recuerdan la primera cita y otras que ya queremos bailar contigo. Cuéntanos cuál no puede faltar en nuestra boda." },
      custom: { title: "Antes de llegar", content: "La ceremonia será al aire libre. Lleva un abrigo ligero para la noche y procura llegar 15 minutos antes para encontrar tu lugar con calma.", detail: "Acceso por la entrada principal de la hacienda." },
    },
  },
  birthday: {
    label: "Cumpleaños", slug: "cumpleanos", defaultName: "Mi cumpleaños",
    heroKicker: "UNA VUELTA MÁS AL SOL", heroIntro: "Las mejores velitas se apagan en buena compañía",
    welcomeTitle: "¡Que empiece la fiesta!",
    message: "Un año más de historias, aprendizajes y motivos para sonreír. Quiero celebrarlo con mis personas favoritas: ven por un abrazo, quédate por el pastel y acompáñame a crear nuevos recuerdos.",
    recommendedSections: ["story", "reception", "program", "dress_code", "gifts", "rsvp"],
    demo: { name: "Los 30 de Valeria", hostNames: "Valeria Pérez", date: "20 de noviembre de 2027", eventTime: "18:00", venue: "Patio La Luna", address: "Puebla", accent: "#b33e63", typography: "fredoka", bodyTypography: "nunito" },
    sections: {
      story: { title: "Treinta y tantas razones para celebrar", content: "Llego a los 30 con una colección de viajes, anécdotas y amistades que hacen más bonita la vida. Esta fiesta es para agradecer todo lo vivido y brindar por lo que viene." },
      ceremony: { title: "El momento de las velitas", content: "Guarda un poquito de voz para las mañanitas y acompáñame a pedir un deseo antes de partir el pastel.", detail: "8:00 p. m. · Mesa del pastel" },
      reception: { title: "La fiesta es aquí", content: "Nos vemos en Patio La Luna para disfrutar de botanas, una cena entre amigos y una playlist con canciones que todos nos sabemos.", detail: "6:00 p. m. · Bienvenida en el patio" },
      program: { title: "El plan cumpleañero", content: "18:00 — Abrazos y bienvenida\n19:00 — Cena y anécdotas\n20:00 — Mañanitas, deseo y pastel\n20:30 — Música y baile\n23:00 — Última foto de la noche" },
      parents: { title: "Mi primer equipo", content: "Patricia y Roberto", detail: "Gracias por celebrar cada uno de mis años y por ayudarme a preparar esta fiesta." },
      dress_code: { title: "Ven con tu mejor versión de fiesta", content: "Casual festivo. Ponte tu color favorito y zapatos cómodos: la pista de baile va en serio." },
      gifts: { title: "El mejor regalo es verte", content: "No necesitas traer un regalo. Una foto juntos, una buena anécdota y tus ganas de festejar son más que suficientes." },
      rsvp: { title: "¿Te guardo una rebanada?", content: "Confírmame antes del 10 de noviembre si vienes para preparar la cena y que a nadie le falte pastel. Avísame también si tienes alguna restricción alimentaria." },
      gallery: { title: "Una vida en fotografías", content: "De las primeras fiestas a las aventuras más recientes: cada foto tiene una historia y alguien a quien agradecer.", detail: "Treinta años de recuerdos compartidos." },
      music: { title: "La playlist de mis 30", content: "Vamos a mezclar los clásicos de nuestra adolescencia con los favoritos de hoy. Mándame esa canción que te hace levantarte de la silla." },
      custom: { title: "Para disfrutar sin prisas", content: "La fiesta será en un patio techado. Trae algo ligero para abrigarte y considera compartir el viaje con tus amigos para llegar juntos." },
    },
  },
  graduation: {
    label: "Graduación", slug: "graduacion", defaultName: "Mi graduación",
    heroKicker: "UN LOGRO QUE SE COMPARTE", heroIntro: "Cerramos una etapa y abrimos un mundo de posibilidades",
    welcomeTitle: "Lo logramos, juntos",
    message: "Detrás de este logro hay horas de estudio, retos superados y personas que nunca dejaron de creer en nosotros. Queremos celebrar contigo el final de esta etapa y el inicio de todo lo que viene.",
    recommendedSections: ["story", "ceremony", "reception", "program", "parents", "dress_code", "rsvp"],
    demo: { name: "Generación 2027", hostNames: "Camila y su generación", date: "17 de julio de 2027", eventTime: "18:00", venue: "Centro Cultural Horizonte", address: "Guadalajara", accent: "#755820", typography: "cinzel", bodyTypography: "inter" },
    sections: {
      story: { title: "De la primera clase a este día", content: "Compartimos desvelos, proyectos y amistades que se quedan para siempre. Hoy cambiamos los apuntes por nuevos sueños y celebramos todo lo que aprendimos en el camino." },
      ceremony: { title: "Entrega de reconocimientos", content: "Acompáñanos al acto de graduación en el auditorio del Centro Cultural Horizonte. Escucharemos nuestros nombres con el orgullo de saber que este logro también les pertenece a quienes nos apoyaron.", detail: "6:00 p. m. · Auditorio principal" },
      reception: { title: "El brindis de una nueva etapa", content: "Al terminar la ceremonia nos reuniremos en el salón del centro cultural para cenar, tomarnos muchas fotos y celebrar con nuestras familias y amigos.", detail: "8:00 p. m. · Salón Horizonte" },
      program: { title: "Programa de graduación", content: "17:30 — Registro de invitados\n18:00 — Ceremonia y reconocimientos\n19:15 — Fotografía de generación\n20:00 — Cena y brindis\n21:30 — Celebración y baile" },
      parents: { title: "A quienes hicieron posible este logro", content: "Nuestras familias\nNuestros docentes\nNuestras amistades", detail: "Gracias por los consejos, la paciencia y la confianza. Este diploma también lleva su esfuerzo." },
      dress_code: { title: "Una noche para vestir de gala", content: "Formal. Los graduados llevarán toga y birrete durante el acto; después podrán retirarlos para disfrutar de la celebración." },
      gifts: { title: "Tu apoyo ya es un regalo", content: "Nos acompañaste durante el camino y nos encantará que estés en la meta. No es necesario traer un obsequio: queremos compartir este momento contigo." },
      rsvp: { title: "Reserva tu lugar en este logro", content: "Confirma con los organizadores antes del 3 de julio e indica cuántas personas asistirán. Así podremos asignar los lugares del auditorio y preparar la cena." },
      gallery: { title: "Los años que nos formaron", content: "Primera clase, proyectos, prácticas y amigos: un recorrido por los momentos que dieron forma a nuestra generación.", detail: "Generación 2027 · Recuerdos que nos llevamos." },
      music: { title: "Las canciones de nuestra generación", content: "Hay canciones que acompañaron los desvelos y otras que merecen sonar en nuestro último baile como estudiantes. Comparte tu favorita con el comité organizador." },
      custom: { title: "Información para la ceremonia", content: "Llega 30 minutos antes para registrarte y ubicar tu asiento. Durante la entrega de reconocimientos habrá un fotógrafo; al finalizar tendremos tiempo para fotos con cada familia." },
    },
  },
  baby_shower: {
    label: "Baby shower", slug: "baby-shower", defaultName: "Nuestro baby shower",
    heroKicker: "UN PEQUEÑO GRAN COMIENZO", heroIntro: "La familia crece y la ilusión también",
    welcomeTitle: "Ya viene alguien muy especial",
    message: "Hay un nuevo latido llenando nuestra casa de ilusión. Antes de conocer sus manitas y su sonrisa, queremos reunir a quienes formarán parte de su mundo para compartir una tarde llena de cariño.",
    recommendedSections: ["story", "reception", "program", "parents", "gifts", "dress_code", "rsvp"],
    demo: { name: "Esperando a Emilia", hostNames: "Lucía y Daniel", date: "14 de agosto de 2027", eventTime: "12:00", venue: "Jardín Los Olivos", address: "Mérida", accent: "#526d56", typography: "comfortaa", bodyTypography: "nunito" },
    sections: {
      story: { title: "Una dulce espera", content: "Desde que supimos que Emilia venía en camino, nuestros días se llenaron de planes, preguntas y mucho amor. Nos emociona imaginar todas las aventuras que viviremos en familia." },
      ceremony: { title: "Buenos deseos para Emilia", content: "Tendremos un momento para compartir consejos y escribirle a Emilia una carta que guardaremos para cuando sea mayor.", detail: "1:30 p. m. · Mesa de los buenos deseos" },
      reception: { title: "Una tarde para apapacharnos", content: "Te esperamos en Jardín Los Olivos para compartir comida rica, juegos y conversaciones sobre esta nueva aventura. Será una reunión para toda la familia.", detail: "12:00 p. m. · Bienvenida en el jardín" },
      program: { title: "Una tarde llena de ilusión", content: "12:00 — Bienvenida y bebidas frescas\n12:30 — Comida en familia\n13:30 — Juegos y buenos deseos\n14:30 — Postres y fotografías\n15:30 — Despedida con mucho cariño" },
      parents: { title: "Los futuros papás", content: "Lucía y Daniel", detail: "Aprendiendo a ser tres, acompañados por las personas que más queremos." },
      dress_code: { title: "Cómodos y con mucho cariño", content: "Casual en tonos claros, verdes suaves o colores que te hagan sentir bien. El jardín tiene césped, así que te recomendamos zapatos cómodos." },
      gifts: { title: "Pequeños detalles, mucho amor", content: "Lo más importante es que nos acompañes. Si deseas regalarle algo a Emilia, puedes preguntarnos por la lista de artículos que todavía necesitamos para preparar su llegada." },
      rsvp: { title: "¿Compartimos la dulce espera?", content: "Avísanos antes del 4 de agosto si podrás acompañarnos y cuántas personas vendrán contigo. Los pequeños también son bienvenidos; dinos sus edades para preparar los juegos." },
      gallery: { title: "Mientras te esperamos", content: "Los primeros preparativos, las manos sobre la pancita y los abrazos de quienes ya te quieren: recuerdos de una espera muy especial.", detail: "Emilia, ya tienes un lugar en nuestros corazones." },
      music: { title: "Canciones para una dulce espera", content: "Estamos reuniendo canciones tranquilas y melodías que nos gustaría compartir con Emilia. Cuéntanos cuál te recuerda a tu infancia." },
      custom: { title: "Una reunión para toda la familia", content: "Habrá un espacio con sombra para descansar y una mesa para dejar los regalos. Si necesitas un lugar cómodo para alimentar o cambiar a tu bebé, acércate a nosotros." },
    },
  },
  anniversary: {
    label: "Aniversario", slug: "aniversario", defaultName: "Nuestro aniversario",
    heroKicker: "VOLVER A ELEGIRNOS", heroIntro: "El tiempo pasa, las razones para celebrar se multiplican",
    welcomeTitle: "Una historia que sigue creciendo",
    message: "Los años se llenan de sentido con las personas que caminan a nuestro lado. Queremos celebrar el amor, las aventuras y la familia que hemos construido, rodeados de quienes forman parte de nuestra historia.",
    recommendedSections: ["story", "ceremony", "reception", "program", "dress_code", "gifts", "rsvp"],
    demo: { name: "25 años de nosotros", hostNames: "Elena y Gabriel", date: "18 de septiembre de 2027", eventTime: "18:00", venue: "Hacienda Los Encinos", address: "Querétaro", accent: "#866137", typography: "playfair-display", bodyTypography: "lora" },
    sections: {
      story: { title: "Veinticinco años después", content: "Lo que comenzó con una promesa se convirtió en mañanas compartidas, una familia y miles de recuerdos. Veinticinco años después seguimos encontrando razones para elegirnos." },
      ceremony: { title: "Renovamos nuestra promesa", content: "Compartiremos unas palabras y renovaremos los votos que nos han acompañado durante estos 25 años. Nos hará muy felices que estés presente en este nuevo sí.", detail: "6:00 p. m. · Terraza de la hacienda" },
      reception: { title: "La mesa de nuestra historia", content: "Nos espera una cena en Hacienda Los Encinos para brindar por lo vivido, recordar nuestras mejores anécdotas y volver a bailar las canciones de siempre.", detail: "7:30 p. m. · Cena de aniversario" },
      program: { title: "Una noche para volver a celebrar", content: "18:00 — Bienvenida y renovación de votos\n19:00 — Fotografías con la familia\n19:30 — Cena y brindis\n21:00 — Nuestro baile de aniversario\n21:30 — Música y recuerdos" },
      parents: { title: "La familia que creció con nosotros", content: "Nuestros hijos\nNuestros padres\nNuestra familia de siempre", detail: "Gracias por hacer más grande esta historia. Cada uno tiene un lugar en estos 25 años." },
      dress_code: { title: "Elegancia para una noche especial", content: "Formal. Los detalles en tonos plata son bienvenidos para acompañar nuestras bodas de plata, aunque lo más importante es que te sientas a gusto." },
      gifts: { title: "El regalo de seguir cerca", content: "Después de tantos años, sabemos que lo más valioso no se envuelve. Regálanos tu presencia y, si quieres, una fotografía o una anécdota de nuestra historia juntos." },
      rsvp: { title: "Sigamos sumando recuerdos", content: "Confirma con nosotros antes del 4 de septiembre para reservar tu lugar en la cena. Nos encantará saber si tienes alguna necesidad alimentaria." },
      gallery: { title: "Ayer, hoy y siempre", content: "Nuestra boda, los primeros años y la familia de hoy: imágenes de una vida que seguimos construyendo juntos.", detail: "25 años · Una historia compartida." },
      music: { title: "Las canciones que se quedaron", content: "Volverá a sonar la canción de nuestro primer baile y esas melodías que nunca faltan en casa. Ayúdanos a recordar la banda sonora de estos años." },
      custom: { title: "Trae un recuerdo contigo", content: "Prepararemos una mesa de recuerdos. Si tienes una fotografía impresa o una pequeña historia que quieras compartir, tráela: nos encantará descubrir lo que guardas de nosotros." },
    },
  },
  other: {
    label: "Otro evento", slug: "reunion", defaultName: "Nuestra celebración",
    heroKicker: "VOLVAMOS A ENCONTRARNOS", heroIntro: "No hace falta esperar una gran fecha para reunirnos",
    welcomeTitle: "Qué gusto volver a verte",
    message: "Entre rutinas y distancias, a veces nos faltan momentos para estar juntos. Hagamos una pausa para compartir la mesa, ponernos al día y crear nuevas historias con las personas que queremos.",
    recommendedSections: ["story", "reception", "program", "dress_code", "gifts", "rsvp"],
    demo: { name: "Volver a encontrarnos", hostNames: "Familia Rivera", date: "6 de junio de 2027", eventTime: "13:00", venue: "Parque La Arboleda", address: "Ciudad de México", accent: "#31756c", typography: "outfit", bodyTypography: "dm-sans" },
    sections: {
      story: { title: "Una mesa para todos", content: "Hace tiempo que queremos reunir a la familia sin prisas, agendas ni pantallas de por medio. Esta vez la invitación es sencilla: pasar un buen día juntos y recuperar esas conversaciones pendientes." },
      ceremony: { title: "El abrazo de bienvenida", content: "Comenzaremos con una fotografía de toda la familia y unas palabras para agradecer que, desde cerca o desde lejos, hayamos podido coincidir.", detail: "1:30 p. m. · Punto de reunión" },
      reception: { title: "Nos vemos bajo los árboles", content: "Prepararemos una comida compartida en Parque La Arboleda, con espacio para platicar, jugar y dejar que la tarde transcurra a su propio ritmo.", detail: "1:00 p. m. · Área de convivencia" },
      program: { title: "Un día para convivir", content: "13:00 — Llegada y bienvenida\n13:30 — Fotografía de familia\n14:00 — Comida compartida\n15:30 — Juegos y sobremesa\n17:00 — Café y despedida" },
      parents: { title: "Quienes nos reúnen", content: "Mariana y Alejandro Rivera", detail: "Con ayuda de toda la familia, estamos preparando un día para volver a coincidir." },
      dress_code: { title: "Ven como te sientas mejor", content: "Ropa casual y calzado cómodo para disfrutar del parque. No olvides sombrero o gorra y una prenda ligera para la tarde." },
      gifts: { title: "Algo para compartir", content: "No habrá intercambio de regalos. Si te nace traer algo, puede ser un postre, tu juego de mesa favorito o una fotografía para recordar juntos." },
      rsvp: { title: "¿Te contamos para la comida?", content: "Avísanos antes del 30 de mayo cuántas personas vendrán contigo y si hay alguna restricción alimentaria. Así organizaremos la mesa para que todos tengan su lugar." },
      gallery: { title: "Recuerdos de familia", content: "Fotografías de otros encuentros y de las personas que nos mantienen unidos, aunque vivamos en ciudades distintas.", detail: "Las historias que siempre nos gusta volver a contar." },
      music: { title: "Música para la sobremesa", content: "Cada quien puede proponer una canción que le recuerde a la familia. Tendremos música suave para acompañar la comida y tiempo para cantar nuestros clásicos." },
      custom: { title: "Lo que conviene traer", content: "Lleva agua, protector solar y una manta si quieres sentarte en el césped. Compartiremos el punto exacto de encuentro con quienes confirmen su asistencia." },
    },
  },
};

export function getInvitationEventContent(eventType: string): EventContent {
  return Object.hasOwn(eventContent, eventType) ? eventContent[eventType as InvitationEventType] : eventContent.other;
}

export function makeEventExampleSection(type: SectionType, eventType: string, id = `default-${type}`): InviteSection {
  return {
    id, type, detail: "", link: "", imageUrl: "", imageUrls: [], enabled: true,
    ...getInvitationEventContent(eventType).sections[type],
  };
}

export function eventExampleSections(eventType: string): InviteSection[] {
  return getInvitationEventContent(eventType).recommendedSections.map((type) => makeEventExampleSection(type, eventType));
}
