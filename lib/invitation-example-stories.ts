export type ExampleStory = { key: string; hostNames: string; eventDateKey: string; eventTime: string; city: string; venue: string; title: string; story: string };
export const exampleStories: Record<string, ExampleStory> = {
  "wedding": {
    "key": "sofia-mateo",
    "hostNames": "Sofía y Mateo",
    "eventDateKey": "2027-10-12",
    "eventTime": "17:00",
    "city": "Oaxaca",
    "venue": "Hacienda Las Nubes",
    "title": "Boda en un jardín de hacienda",
    "story": "Nos conocimos en una exposición de fotografía y desde entonces aprendimos a mirar la vida juntos. Queremos celebrar nuestra boda entre jardines y las personas que han acompañado nuestra historia."
  },
  "birthday": {
    "key": "valeria-30",
    "hostNames": "Valeria",
    "eventDateKey": "2027-08-14",
    "eventTime": "19:00",
    "city": "Guadalajara",
    "venue": "Terraza del Sol",
    "title": "Los 30 de Valeria",
    "story": "Cumplo treinta años y quiero brindar por las amistades, los viajes y las pequeñas aventuras que me han traído hasta aquí. Nos espera una cena en la terraza y una noche de baile."
  },
  "graduation": {
    "key": "daniela-arquitectura",
    "hostNames": "Daniela",
    "eventDateKey": "2027-07-17",
    "eventTime": "17:00",
    "city": "Querétaro",
    "venue": "Patio de la Cantera",
    "title": "Daniela · Arquitectura",
    "story": "Después de cinco años de maquetas, planos y noches de estudio, terminé Arquitectura. Quiero celebrar este logro con quienes creyeron en mí y me ayudaron a construirlo."
  },
  "baby_shower": {
    "key": "bienvenida-sofia",
    "hostNames": "Ana y Luis",
    "eventDateKey": "2027-05-15",
    "eventTime": "12:00",
    "city": "Mérida",
    "venue": "Jardín Azahar",
    "title": "Esperando a Sofía",
    "story": "Estamos esperando a Sofía y queremos compartir la ilusión de su llegada. Nos reuniremos para una comida tranquila, juegos y buenos deseos para esta nueva etapa en familia."
  },
  "anniversary": {
    "key": "laura-javier-25",
    "hostNames": "Laura y Javier",
    "eventDateKey": "2027-10-09",
    "eventTime": "18:00",
    "city": "Oaxaca",
    "venue": "Patio de la Bugambilia",
    "title": "25 años de Laura y Javier",
    "story": "Hace veinticinco años comenzamos una vida juntos. Hoy celebramos las conversaciones, los retos y la familia que hemos construido con una cena para volver a brindar por nuestro amor."
  },
  "other": {
    "key": "reencuentro-2017",
    "hostNames": "Generación 2017",
    "eventDateKey": "2027-07-24",
    "eventTime": "17:00",
    "city": "Monterrey",
    "venue": "Terraza Encuentro",
    "title": "Reencuentro de la generación 2017",
    "story": "Han pasado diez años desde que terminamos la preparatoria. Es momento de reencontrarnos, compartir en qué se han convertido nuestros sueños y recordar las historias del salón."
  }
};
