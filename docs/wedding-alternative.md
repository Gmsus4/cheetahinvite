# Bodas · diseño alternativo

Trabajo experimental en `codex/boda-alt`. El estado previo completo está guardado en el commit `1f321eb` de `master`.

Las doce bodas del catálogo v2 comparten fondo fotográfico continuo, portada con retrato, cuenta regresiva y paneles translúcidos con desenfoque. En escritorio (desde 960 px) la composición alcanza 1080 px: todas las secciones tienen el mismo ancho que la portada, tengan o no imágenes. Portada y secciones con imágenes se distribuyen en dos columnas, salvo la galería; los apartados sin imágenes conservan una sola columna, sin espacios vacíos. En móvil y tablet se conserva la lectura vertical hasta 560 px. Cada identidad conserva sus seis paletas, fuentes y recursos originales. No se incorporan imágenes, textos ni recursos de AnyInvite.

`WeddingAtmosphereInvitation` se usa a través de `WeddingInvitation` en ejemplos, editor y páginas públicas. Las miniaturas de `WeddingDesignPreview` reflejan la misma dirección visual. Los renderizadores de papelería anteriores permanecen en el repositorio; las invitaciones v1 conservan su renderizador. Esta rama no cambia identificadores, datos guardados, publicación, pagos ni el sistema de RSVP.

## Contenido

En escritorio, `wa-intro` integra la portada y un único temporizador en una superficie de blur: textos arriba a la izquierda, cuenta regresiva debajo y retrato a la derecha ocupando ambas filas. El bloque de bienvenida posterior se oculta únicamente en escritorio. En móvil y tablet, portada, temporizador independiente y bienvenida mantienen su distribución vertical. Si no hay fecha, no se muestra el temporizador y los textos ocupan la altura de la columna izquierda.

El contenedor `wa-shell` organiza desde «Nuestra boda» hasta la confirmación sin añadir una capa exterior de blur. Cada panel tiene su propio acabado Auto/Blur/BlurColor/Color, sin bordes de color ni líneas de sombra interiores y con sombra exterior suave. En escritorio, las secciones con imágenes comparten una sola superficie del ancho de la portada, con texto y fotografías dentro y 24 px de margen interior; el panel de texto no añade otra capa de blur. Blur combina cristal neutro con un degradado tenue y desenfoque de 16 px; BlurColor incorpora el tono del tema con 24 px de desenfoque; Color es sólido. La portada utiliza 20 px de desenfoque. Las fotografías y el retrato tienen esquinas redondeadas uniformes, sin curvas asimétricas. Las superficies conservan un fondo opaco cuando el navegador no admite backdrop-filter.

Se retiraron todas las decoraciones botánicas del renderizador alternativo: esquinas, ramas, flores de bienvenida y despedida y capas florales del fondo. Los recursos originales permanecen disponibles para las versiones anteriores.

Los paneles alternan por defecto **Blur → BlurColor → Color**, contando únicamente los bloques visibles. Blur muestra un cristal neutro; BlurColor mezcla el color del tema con transparencia y desenfoque; Color usa el tono sólido sin blur. En cada detalle del editor, **Fondo de esta sección** ofrece **Auto | Blur | BlurColor | Color**. Auto restaura la alternancia y las elecciones explícitas se conservan al guardar, recuperar un borrador y cambiar de diseño. El campo opcional `InviteSection.panelStyle` admite `auto`, `blur`, `blur-color` y `color`; su ausencia equivale a Auto. Las fotos entre paneles mantienen su imagen nítida.

Se conservan mensaje, fecha, hora, lugar, dirección y secciones activadas. El itinerario mantiene cada línea; ceremonia y recepción mantienen enlaces a Maps; galería, familias, vestimenta, regalos y confirmación conservan su contenido. Música y secciones personalizadas también se renderizan si existen. Solo se omiten apartados desactivados o vacíos.

El fondo usa únicamente Foto de fondo (`Event.backgroundImageUrl`), independiente de Una foto especial (portada) y de la galería. Es una imagen continua a pantalla completa en móvil y escritorio, sin collage ni distribución automática. Sin fondo elegido se usan los colores y recursos del diseño. No se rellenan eventos existentes con fotos de ejemplo. La migración 20261104000001_wedding_background añade la columna nullable; el guardado, recuperación y limpieza de Cloudinary incluyen esta referencia. El desenfoque tiene alternativa opaca para navegadores sin soporte. El formulario sigue utilizando `RsvpForm` y el mismo identificador público del evento.

La sección de fotografías usa `WeddingPhotoCarousel`: título centrado, foto de ancho completo, flechas superpuestas, contador discreto e indicadores debajo. Todas las fotos comparten un marco fijo de proporción 3:2, con `object-fit: cover` y el encuadre ligeramente elevado para cuidar los rostros. El carrusel conserva el mismo ancho y alto al navegar, incluso al alternar fotografías verticales y horizontales. La cuadrícula de imágenes adjuntas usa `wa-photo-grid`, independiente de la sección `wa-gallery`, para no dividir su encabezado y carrusel en columnas. Permite deslizar horizontalmente en móvil, usar las flechas del teclado y saltar con Inicio/Fin. Las imágenes no tienen controles de ampliación ni enlaces para abrirlas. No avanza automáticamente, respeta el movimiento reducido y oculta los controles de navegación cuando solo hay una foto.

## Fotos entre secciones

En **Dale tu toque**, al activar un detalle aparece **Foto junto a esta sección**. En escritorio, las secciones con imágenes alternan automáticamente **imagen/texto → texto/imagen**, contando solo las secciones visibles con imágenes. La portada y la galería no entran en esa cuenta. La galería siempre muestra el título y el texto centrados arriba, con el carrusel debajo a todo el ancho interior, tanto en escritorio como en móvil. Quitar, desactivar o agregar imágenes recalcula la alternancia sin dejar saltos por los apartados sin foto. La foto ocupa toda la altura interior disponible, respetando los 24 px de margen superior e inferior. La imagen se encuadra con `object-fit: cover`, sin deformarse, y crece cuando el texto requiere más altura. El retrato de portada y el carrusel también aprovechan la altura de su columna; los indicadores del carrusel conservan su espacio. En móvil, el selector **¿Dónde quieres mostrar la foto en móvil?** conserva **Antes de esta sección** o **Después de esta sección**, con formato 3:2, independientemente de la alternancia de escritorio. La galería conserva el carrusel y sus controles. Quitar o desactivar la sección también quita su foto de la invitación; el contenido se conserva para reactivarla.

En escritorio, el texto de cada sección con imágenes se alinea hacia la foto: a la izquierda cuando la imagen está a la izquierda y a la derecha cuando está a la derecha. Títulos, iconos y programa acompañan esa alineación. Las secciones sin imágenes y la lectura móvil conservan su alineación habitual.

`InviteSection.imageUrl` conserva la referencia de la imagen y `imagePosition` guarda `before` o `after` (por defecto, `after`). La carga, los permisos, el almacenamiento y la limpieza siguen usando Cloudinary y las protecciones existentes. No se necesita una migración porque las secciones se guardan en JSON. Los ejemplos públicos incluyen dos fotos intercaladas para mostrar el resultado; no se añaden fotos de ejemplo a eventos reales.

## Revisar ejemplos

- `/disenos-boda`: doce diseños, seis paletas y vista con/sin fotografía.
- `/ejemplo-invitacion/boda-floral`: ejemplo completo.
- `/ejemplo-invitacion/boda-minimal?foto=no`: variante sin retrato.
- `/ejemplo-invitacion/boda-starlight`: identidad nocturna.

Esta primera versión utiliza fotografía. El modelo actual no tiene un campo para video de fondo; no se introduce un reproductor ni se reutilizan enlaces de música como video.

Antes de incorporar esta propuesta a producción, decidir su versionado: esta rama cambia deliberadamente la presentación del catálogo v2 para compararla con la versión preservada en `master`.
