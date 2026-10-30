# Vaquero

Octavo diseño de cumpleaños, añadido a petición del propietario a la colección inicial. Identidad persistida: `birthday-cowboy-v1`. Ejemplo: `/ejemplo-invitacion/cumpleanos-vaquero`.

La composición se organiza como escenas diferentes: cartel tipográfico de rodeo, bienvenida editorial con toro, boleto con talón para ubicación, ruta vertical de horarios sobre cuero, prendas dispuestas sobre papel de caballos, carta de regalos sujeta con un alfiler, letrero de saloon para música, recibo de reserva para RSVP y etiquetas de calendario colgadas para la cuenta regresiva. Los títulos usan Rye, instalada en el proyecto mediante `@fontsource/rye` y servida localmente. Nunito se usa en lectura y Caveat en notas manuscritas. Los textos de lectura, etiquetas y controles del formulario tienen 16 px; los títulos conservan su jerarquía. No hay líneas detrás de los párrafos. Solo el papel de caballos se repite a 360 px de ancho. El cuero conserva su escala original con `cover`, sin repetición, al igual que el paisaje de portada. Los degradados cubren toda la superficie.

Los quince recursos vigentes se optimizaron en `public/birthday/cowboy/`, conservando la transparencia de las doce ilustraciones. El paisaje y las dos texturas conservan su fondo. La textura de piel moteada anterior se sustituyó por el cuero de `textura.webp`. Los originales no se modificaron.

| Original | Recurso publicado | Uso |
| --- | --- | --- |
| `herosection.png` | `desert-hero.webp` | Fondo de portada y miniatura |
| `sombrero.png` | `hat.webp` | Portada |
| `toro.png` | `bull.webp` | Bienvenida |
| `Capa 3.png` | `bandana.webp` | Composición de vestimenta |
| `nopal2.png` | `wagon-cactus.webp` | Ubicación |
| `Capa 4.png` | `longhorn-skull.webp` | Programa |
| `botas.png` | `boots.webp` | Vestimenta |
| `cinto.png` | `belt.webp` | Vestimenta |
| `lazo.png` | `lasso.webp` | Regalos |
| `tequila.png` | `tequila.webp` | Música |
| `Capa 5.png` | `horseshoe.webp` | Confirmación |
| `textura.webp` | `leather.webp` | Programa, saloon y cuenta regresiva |
| `textura2.jpg` | `horse-paper.webp` | Papel de caballos en bienvenida, vestimenta y reserva |
| `nopal.png` | `desert-cactus.webp` | Cierre |
| `espuela.png` | `spur.webp` | Cierre |

El renderizador `BirthdayCowboyInvitation.tsx` se selecciona desde `InvitationCanvas` y usa los datos reales del editor. La fotografía personal es opcional y se muestra como recuerdo enmarcado después de la bienvenida. Programa, secciones opcionales, fotos, enlaces, confirmación y cuenta regresiva reutilizan el modelo común. No introduce datos ficticios al crear un borrador ni al seleccionar el diseño. El ejemplo público es independiente y usa datos ficticios.

Las galerías muestran sus fotos, título y textos sin ilustraciones, sellos, costuras ni marcos decorativos. Las confirmaciones integradas reciben `publicEventId`; el modo externo conserva el enlace configurado. Los botones y los datos adicionales tienen separación propia. El identificador `birthday-cowboy-v1` se conserva al rediseñar las escenas y los datos personales no se reemplazan.

Disponible en el selector compartido, catálogo público y ruta de ejemplo. Elegirlo configura Rye/Nunito y el acento terracota, conservando el contenido personal. El acento afecta a títulos destacados y formulario; la paleta secundaria de cuero y papel permanece fija.

Verificación: TypeScript, ESLint, análisis de CSS y 39 pruebas combinadas de Vaquero, Gamer, modelo guiado, plantillas, enlaces y RSVP. Revisión visual a 1280, 390 y 320 px; sin desbordamiento horizontal ni imágenes fallidas. Se probó el formulario público en demostración, sin enviar respuestas reales.
