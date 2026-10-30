# Bodas con diseños cerrados

La segunda edición conserva los doce nombres con identificadores `-v2`. El catálogo `legacyWeddingDesigns` y el renderizador original mantienen las invitaciones `-v1`. Las composiciones de la nueva edición se implementan en `WeddingIdentityInvitation` y `app/wedding-identities.css`. La galería `/disenos-boda` permite comparar las invitaciones completas y sus paletas sin iniciar sesión. Ver [dirección artística y recursos reemplazables](wedding-identities-resources.md).

Todos los tipos de evento usan ahora el asistente compartido de cuatro pasos: celebración y diseño, datos principales, personalización y revisión. Las identidades de boda y sus renderizadores versionados se conservan. Ver el [contexto actualizado de la colección](../README-DISENOS.md).

## Diseños y compatibilidad

`lib/wedding-designs.ts` define doce identidades versionadas, cada una con seis paletas completas:

| Diseño | Identificador | Recursos originales |
| --- | --- | --- |
| Floral romántico | `wedding-floral-v1` | Flores blancas, plantilla 5 |
| Editorial elegante | `wedding-editorial-v1` | Composición fotográfica |
| Minimalista | `wedding-minimal-v1` | Composición tipográfica |
| Jardín de azafrán | `wedding-garden-v1` | Plantilla 1 |
| Flor de cerezo | `wedding-blossom-v1` | Plantilla 2 |
| Bugambilias | `wedding-bougainvillea-v1` | Plantilla 3 |
| Flores amarillas | `wedding-sunlight-v1` | Plantilla 4 |
| Olivo y lino | `wedding-olive-v1` | Plantilla 6: esquinas de olivo, rama, mariposa y textura de lino |
| Costa mediterránea | `wedding-mediterranean-v1` | Plantilla 7: azulejos, esquinas de cerámica y limones en acuarela |
| Art Déco | `wedding-art-deco-v1` | Oro original y geometría construida en SVG/CSS |
| Carta de amor | `wedding-love-letter-v1` | Plantilla 8: cuatro esquinas, sello, mariposa y papel antiguo |
| Bajo las estrellas | `wedding-starlight-v1` | Cielo nocturno, nebulosa y luna llena fotográfica; constelaciones en SVG |

Cada diseño fija composición, fuentes, botones y paletas completas. Se guarda en el campo `templateId` existente; no se necesita una migración. Los identificadores `none` y `plantilla1` a `plantilla5` mantienen el renderizado anterior. Las paletas iniciales de los primeros tres diseños conservan sus valores.

`InvitationEditor` selecciona el editor apropiado. `InvitationCanvas` selecciona el mismo renderizador para la página pública, la vista privada y los ejemplos. La vista previa del asistente usa `WeddingInvitation`, dentro del iframe existente, y empieza en móvil. `WeddingDesignPicker` muestra las ilustraciones y las fuentes correspondientes a cada identidad. `weddingArtwork` resuelve los recursos desde el manifiesto generado por `templates:sync`; las imágenes originales no se modifican.

Olivo y lino incorpora el recurso `textura.jpg` mediante el slot `texture` del sincronizador. Se publica como `texture.jpg` y se aplica atenuado junto a los colores de cada paleta. El diseño usa una tarjeta de papel con marco fino, fotografía tipo impresión, ramas en esquinas y mariposas pequeñas. Sus seis paletas son Olivo y marfil, Salvia y crema, Arena natural, Olivo y terracota, Eucalipto y lino y Bosque profundo.

Los siete diseños anteriores incorporan las texturas proporcionadas, optimizadas en WebP en `public/textures/wedding`: algodón (`textura-algodon.jpg`) para Floral romántico, Editorial elegante, Minimalista y Bugambilias; papel con fibras (`textura1.jpg`) para Jardín de azafrán y Flor de cerezo; lino (`Texturelabs_Fabric_182M.jpg`) para Flores amarillas. `WeddingDesign.texture` y `weddingArtwork` comparten el recurso entre el selector, la vista previa y la invitación pública. Cada identidad ajusta escala e intensidad: portada y bienvenida son más expresivas, los capítulos de lectura más tenues. Las capas se pintan debajo del contenido, conservando los degradados y colores de la paleta, fotos e ilustraciones. Olivo conserva su tratamiento existente. Las texturas de pelo, grunge, papel envejecido y madera quedan sin aplicar por su contraste y carácter distintos de estas identidades.

En Flores amarillas se conservan los fondos lisos y el degradado originales. El lino se limita a dos acentos pequeños, detrás del título de portada y del ornamento de bienvenida, con máscara radial que desaparece hacia todos los bordes. No se aplica a secciones completas, tarjetas, cuenta regresiva ni pie de página, para evitar franjas o divisiones horizontales.

Costa mediterránea conserva la colección 7, con una composición de postal costera: nombres grandes en una sola línea adaptable, fotografía panorámica, pieza de azulejos desplazada y limones superpuestos. La bienvenida se compone en dos columnas; los capítulos son centrados, el itinerario horizontal en escritorio y la galería alterna alturas. No usa la esquina de cerámica ni los marcos laterales de la propuesta inicial. El patrón ocupa el slot `texture`, sin activar las capas de papel globales. `app/wedding-mediterranean.css` incluye las variantes móvil, sin fotografía y con nombres largos. Conserva las seis paletas y todos los datos de la invitación.

Art Déco usa una portada tipográfica simétrica, un abanico SVG, marco escalonado y fotografía opcional en una pieza separada con esquinas recortadas. La textura original `oro.jpg` se conserva en `public/textures/wedding/gold-leaf.jpg` y se aplica mediante `WeddingDesign.foil` exclusivamente a detalles metálicos; no activa texturas de papel ni colecciones florales. `app/wedding-art-deco.css` define fondos oscuros, capítulos numerados, botones delineados y el formulario de confirmación adaptado a las seis paletas: Oro y ónix, Champaña, Esmeralda nocturna, Zafiro, Borgoña y Plata y carbón. Las pruebas comprueban el contraste de botones delineados contra los fondos y el guardado de las 72 combinaciones del catálogo.

Carta de amor se inspira en las dos referencias del propietario sin publicar sus imágenes ni copiar sus textos. La portada usa una hoja manuscrita sobre un sobre abierto con sello de cera; la fotografía opcional aparece como recuerdo impreso junto a una nota. Dos esquinas decoran la hoja y las otras dos la despedida. La mariposa acompaña el recuerdo y la bienvenida. `LoveLetterCover` y `app/wedding-love-letter.css` definen la composición, la variante sin foto y la adaptación móvil. El papel original de la colección 8 se aplica atenuado, sin repetirse como mosaico ni activar el tratamiento global de textura. Las seis paletas son Tinta de vino, Rosa antiguo, Sepia, Ciruela, Oliva de época y Azul de tinta.

Bajo las estrellas completa el catálogo de doce diseños. La paleta principal retoma el azul `#1F2A44`, marfil `#E8DCC8` y oro suave `#C6A75E` de las referencias del propietario. La portada combina nombres alineados a la izquierda con un diagrama celestial SVG y la luna llena fotográfica transparente del propietario, sobre el cielo original `Texturelabs_Sky_170M.jpg`. `cieloestrellado5.jpg` aporta una nebulosa atenuada en zonas decorativas; los fondos y `full-moon.png` se conservan en `public/celestial/`. Las fotografías de celebraciones y los tableros de color no se publican. El diagrama es decorativo y no se presenta como una carta astronómica calculada para la fecha. `StarlightCover` y `app/wedding-starlight.css` definen la portada, fotografía opcional en una sección aparte, interiores y confirmación sobre fondos oscuros. Las seis paletas son Noche y oro suave, Luz de luna, Azul profundo, Noche amatista, Aurora y Cielo de champaña. Una trama fina de grano repetible sin costuras aporta textura mate al azul de fondo, sin cubrir fotografías ni texto. La luna creciente vectorial se retiró también del selector. Los recursos `WeddingDesign.celestial` son independientes de las texturas de papel y de las colecciones florales.

Los cambios futuros que alteren sustancialmente una identidad publicada deben tener un identificador nuevo. No convertir automáticamente invitaciones anteriores: su diseño es parte del contenido elegido por el cliente.

## Contenido y guardado

Las secciones nuevas comienzan sin nombres, lugares ni horarios de ejemplo. Solo la confirmación integrada está activa por defecto. Las ayudas de formulario contienen ejemplos; la bienvenida predeterminada no afirma datos del evento. Desactivar un detalle conserva su contenido para poder reactivarlo y elimina la sección de la invitación.

El servidor normaliza paleta, fuentes, botones y orden al guardar los diseños nuevos. Los detalles tienen un orden fijo y los formularios ofrecen las secciones compatibles, sin controles de composición ni reordenación.

Se reutilizan la copia local, la recuperación, la cola de guardado, los controles de versión y las protecciones de imágenes. Los borradores de creación se guardan localmente hasta el guardado explícito; los borradores existentes se autoguardan. Las invitaciones pagadas necesitan guardar explícitamente. Una copia antigua de creación se recupera en el editor anterior.

Se puede guardar un borrador incompleto. Para continuar al pago se necesitan nombres, fecha, hora, lugar y dirección, además del contenido de los detalles activados. Esta comprobación se aplica en la revisión, en la acción de publicación y al preparar Checkout, incluso si se entra directamente a la página de pago.

## Verificación

- `node --test tests/*.test.cjs`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Las pruebas de diseños ejercitan cambios de identidad sin pérdida de contenido, la existencia de las ilustraciones, el contraste de textos y botones, el guardado de las 72 combinaciones con almacén aislado, la conservación de los recursos de olivo y Costa mediterránea, orden de secciones, preparación idempotente y controles previos al pago. La cuenta temporal de `tests/editor-browser-fixture.cjs` permite comprobar el recorrido completo en navegador sin usar cuentas de clientes.

La extensión a otras celebraciones y el autocompletado de Google Maps quedan fuera de esta primera entrega. Los lugares usan el enlace de búsqueda de Maps existente.
