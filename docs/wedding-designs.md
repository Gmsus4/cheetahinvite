# Bodas con diseños cerrados

Las bodas nuevas usan el asistente de cuatro pasos: celebración y diseño, datos principales, personalización y revisión. Los demás tipos de evento y las bodas anteriores conservan su editor.

## Diseños y compatibilidad

`lib/wedding-designs.ts` define ocho identidades versionadas, cada una con seis paletas completas:

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

Cada diseño fija composición, fuentes, botones y paletas completas. Se guarda en el campo `templateId` existente; no se necesita una migración. Los identificadores `none` y `plantilla1` a `plantilla5` mantienen el renderizado anterior. Las paletas iniciales de los primeros tres diseños conservan sus valores.

`InvitationEditor` selecciona el editor apropiado. `InvitationCanvas` selecciona el mismo renderizador para la página pública, la vista privada y los ejemplos. La vista previa del asistente usa `WeddingInvitation`, dentro del iframe existente, y empieza en móvil. `WeddingDesignPicker` muestra las ilustraciones y las fuentes correspondientes a cada identidad. `weddingArtwork` resuelve los recursos desde el manifiesto generado por `templates:sync`; las imágenes originales no se modifican.

Olivo y lino incorpora el recurso `textura.jpg` mediante el slot `texture` del sincronizador. Se publica como `texture.jpg` y se aplica atenuado junto a los colores de cada paleta. El diseño usa una tarjeta de papel con marco fino, fotografía tipo impresión, ramas en esquinas y mariposas pequeñas. Sus seis paletas son Olivo y marfil, Salvia y crema, Arena natural, Olivo y terracota, Eucalipto y lino y Bosque profundo.

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

Las pruebas de diseños ejercitan cambios de identidad sin pérdida de contenido, la existencia de las ilustraciones, el contraste de textos y botones, el guardado de las 48 combinaciones con almacén aislado, la conservación de los cinco recursos de olivo, orden de secciones, preparación idempotente y controles previos al pago. La cuenta temporal de `tests/editor-browser-fixture.cjs` permite comprobar el recorrido completo en navegador sin usar cuentas de clientes.

La extensión a otras celebraciones y el autocompletado de Google Maps quedan fuera de esta primera entrega. Los lugares usan el enlace de búsqueda de Maps existente.
