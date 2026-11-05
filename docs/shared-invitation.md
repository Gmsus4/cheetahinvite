# Una presentación para todas las celebraciones

La base fotográfica que se ajustó para bodas se utiliza en bodas, cumpleaños, graduaciones, baby showers, aniversarios y otros eventos. La estructura, la tipografía inicial, las paletas, el blur, la alternancia de imágenes, la galería vertical y las animaciones son comunes. Cambian las etiquetas, los títulos iniciales de las secciones y los mensajes según el tipo de celebración.

- Los eventos nuevos utilizan `celebration-v1`, definido en `lib/shared-invitation.ts`.
- `InvitationCanvas` utiliza `WeddingAtmosphereInvitation` para los seis tipos, tanto en el editor como en las invitaciones públicas. El nombre histórico del componente no limita su tipo de evento.
- No se renderizan texturas, flores ni ilustraciones temáticas. Se mantienen los fondos de color y la fotografía de fondo opcional del organizador.
- Todos los tipos permiten fotografía de fondo, portada, galería y fotos junto a las secciones, con los mismos controles de acabado.
- El catálogo activo ya no incluye colecciones específicas para eventos distintos de boda. La página pública muestra un ejemplo del diseño común por ocasión. Las antiguas rutas de ejemplos de cumpleaños redirigen al ejemplo general.
- Los identificadores y archivos antiguos se conservan para compatibilidad e historial. Sus registros guardados se muestran con la presentación común; no se borran eventos, fotografías ni datos personales.
- Los valores antiguos de textura siguen siendo aceptados al leer o guardar datos previos, pero el guardado los normaliza a `none`.
- Los ejemplos públicos contienen datos ficticios identificados como ejemplos. Las invitaciones reales empiezan sin nombres, lugares, fechas ni historias inventadas. Los títulos iniciales y mensajes de bienvenida son propios de cada tipo.

El asistente conserva sus cinco pasos: Tu evento, Fotografías, Detalles, Apariencia y Revisa y publica. La publicación, el pago, los permisos de imágenes y las confirmaciones siguen utilizando los mecanismos compartidos existentes.
