# Bodas · diseño alternativo

Trabajo experimental en `codex/boda-alt`. El estado previo completo está guardado en el commit `1f321eb` de `master`.

Las doce bodas del catálogo v2 comparten ahora una composición centrada: fondo fotográfico continuo, columna de 560 px, portada con retrato, cuenta regresiva y paneles translúcidos con desenfoque. Cada identidad conserva sus seis paletas, fuentes y recursos originales, utilizados como acentos. No se incorporan imágenes, textos ni recursos de AnyInvite.

`WeddingAtmosphereInvitation` se usa a través de `WeddingInvitation` en ejemplos, editor y páginas públicas. Las miniaturas de `WeddingDesignPreview` reflejan la misma dirección visual. Los renderizadores de papelería anteriores permanecen en el repositorio; las invitaciones v1 conservan su renderizador. Esta rama no cambia identificadores, datos guardados, publicación, pagos ni el sistema de RSVP.

## Contenido

Se conservan mensaje, fecha, hora, lugar, dirección y secciones activadas. El itinerario mantiene cada línea; ceremonia y recepción mantienen enlaces a Maps; galería, familias, vestimenta, regalos y confirmación conservan su contenido. Música y secciones personalizadas también se renderizan si existen. Solo se omiten apartados desactivados o vacíos.

El fondo usa la fotografía principal y hasta tres imágenes de la galería activa. Sin fotografía principal, usa degradados, texturas y recursos del propio diseño; no se agregan fotografías de ejemplo a las invitaciones reales. En móvil se muestra un solo fondo para evitar saturación. El desenfoque tiene alternativa opaca para navegadores sin soporte. El formulario sigue utilizando `RsvpForm` y el mismo identificador público del evento.

## Revisar

- `/disenos-boda`: doce diseños, seis paletas y vista con/sin fotografía.
- `/ejemplo-invitacion/boda-floral`: ejemplo completo.
- `/ejemplo-invitacion/boda-minimal?foto=no`: variante sin retrato.
- `/ejemplo-invitacion/boda-starlight`: identidad nocturna.

Esta primera versión utiliza fotografía. El modelo actual no tiene un campo para video de fondo; no se introduce un reproductor ni se reutilizan enlaces de música como video.

Antes de incorporar esta propuesta a producción, decidir su versionado: esta rama cambia deliberadamente la presentación del catálogo v2 para compararla con la versión preservada en `master`.
