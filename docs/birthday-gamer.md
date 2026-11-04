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

El componente `BirthdayGamerInvitation.tsx` usa las propiedades existentes de `InvitationCanvas`, enlaces seguros, el formulario compartido de confirmación y la cuenta regresiva común. Las secciones opcionales están enmarcadas; la galería usa un bento con fotos ampliables, sin adornos ni barra decorativa. La foto personal de portada es opcional. El formulario admite tanto confirmación integrada con `publicEventId` como enlace externo.

Registrado en el catálogo, el selector compartido, el modelo guiado y las rutas de ejemplo. Cambiar de diseño conserva los datos personales y seleccionar Gamer configura Outfit y Nunito.

Comprobaciones: TypeScript, ESLint y pruebas de registro, persistencia de borradores, recursos, renderizado, galería, enlaces y confirmación. La revisión visual en navegador debe comprobarse por separado cuando el control del navegador esté disponible.

La alternancia dinámica de fondos, la galería bento sin adornos y el visor siguen [el comportamiento compartido de cumpleaños](birthday-shared.md).

Se añaden seis recursos WebP a los doce originales (18 en total): `abejaminecraft`, `caballoajedrez`, `clashroyale1`, `clashroyale2`, `pelotabeisbol`, `peonajedrez`. Se convierten con calidad 90, alfa 100 y dimensiones originales. Programa, vestimenta y regalos combinan una ilustración original con una nueva; historia, ceremonia, recepción, familia y apartados personalizados reciben personajes distintos de la colección. La asignación evita repetir imágenes ya presentes en portada, bienvenida y ubicación, y agota las ilustraciones disponibles antes de reutilizarlas en los últimos apartados. Las imágenes sin apartado activo se reúnen en el cierre. Si todas están distribuidas, el cierre puede repetir personajes de la bienvenida. La galería conserva únicamente las fotos del usuario.

El balón de básquet y el personaje en patineta se retiraron del diseño; música conserva a Poco y confirmación conserva al tripulante.
