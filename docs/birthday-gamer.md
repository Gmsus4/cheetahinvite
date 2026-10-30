# Gamer

Séptimo diseño de cumpleaños: `birthday-gamer-v1`. Ejemplo público: `/ejemplo-invitacion/cumpleanos-gamer`.

Identidad de consola arcade con violeta, crema, amarillo, bordes oscuros y sombras desplazadas. Sin resplandores ni destellos de Neón. Tipografías Outfit y Nunito, textos de lectura y etiquetas de 16 px. El acento es personalizable; los fondos secundarios conservan su identidad.

Los doce recursos entregados se sirven como WebP desde `public/birthday/gamer/`; las once ilustraciones conservan su transparencia y la textura de Minecraft conserva su fondo. Los originales no se modificaron.

| Recurso | Ubicación |
| --- | --- |
| `mario-kart`, `lucky-block` | Portada de consola |
| `fall-guy`, `peach-kart`, `spike` | Tarjetas de jugadores en la bienvenida |
| `isabelle` | Ubicación y checkpoint |
| `chicken-rider` | Programa |
| `pixel-dog` | Vestimenta |
| `llama` | Regalos |
| `poco` | Música |
| `crewmate` | Confirmación de asistencia |
| `minecraft-world` | Terreno de la cuenta regresiva |

El componente `BirthdayGamerInvitation.tsx` usa las propiedades existentes de `InvitationCanvas`, enlaces seguros, el formulario compartido de confirmación y la cuenta regresiva común. Las secciones opcionales están enmarcadas; la galería muestra exclusivamente sus fotos y textos, sin ilustraciones ni barra decorativa. La foto personal de portada es opcional. El formulario admite tanto confirmación integrada con `publicEventId` como enlace externo.

Registrado en el catálogo, el selector compartido, el modelo guiado y las rutas de ejemplo. Cambiar de diseño conserva los datos personales y seleccionar Gamer configura Outfit y Nunito.

Comprobaciones: TypeScript, ESLint y pruebas de registro, persistencia de borradores, recursos, renderizado, galería, enlaces y confirmación. La revisión visual en navegador debe comprobarse por separado cuando el control del navegador esté disponible.
