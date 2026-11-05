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

El asistente ofrece seis pantallas cortas después de elegir el tipo de evento: Quién celebra, Fecha y lugar, Fotografías, Contenido, Apariencia y Revisión. Contenido muestra primero la bienvenida y después una sola sección activada cada vez. Se puede avanzar sin fotografías. Cada detalle recomendado tiene un interruptor para incluirlo o excluirlo sin perder su contenido; al terminar se ofrecen opciones adicionales concretas. Apariencia muestra una combinación lista para aceptar; los selectores de colores y tipografías aparecen únicamente al personalizar. La publicación, los pagos y las confirmaciones conservan sus mecanismos existentes.

Los eventos nuevos reciben textos editables desde `lib/invitation-event-presets.ts`, separados de los ejemplos ficticios del catálogo. No se inventan nombres, edades, fechas, direcciones ni enlaces. Las secciones iniciales son:

| Evento | Secciones activadas |
| --- | --- |
| Boda | Historia, itinerario, familias, regalos, confirmación |
| Cumpleaños | Celebración, programa con pastel y buenos deseos, personas especiales, regalos, confirmación |
| Graduación | Logro, programa, agradecimientos, confirmación |
| Baby shower | Dulce espera, programa, familia, regalos para el bebé, confirmación |
| Aniversario | Historia compartida, programa, personas especiales, regalos, confirmación |
| Otro evento | Motivo del encuentro, programa, personas especiales, confirmación |

Ceremonias, sedes adicionales y galerías se activan al completarlas. Al abrir un evento o recuperar un borrador se respetan sus textos y secciones desactivadas; las secciones ausentes se incorporan desactivadas. Al cambiar el tipo de evento se sustituyen solamente los valores que siguen coincidiendo con la sugerencia original. Las secciones personalizadas conservan sus textos, fotografías y estado.

Los itinerarios sugieren momentos de la celebración sin inventar horarios. Cada organizador puede ajustar las actividades y añadir sus horas reales.

Al personalizar Apariencia, los títulos y los textos tienen selectores independientes con todas las fuentes instaladas. Las recomendaciones se agrupan según el tipo de evento y una combinación sugerida puede aplicarse con un botón. La muestra y la vista previa utilizan las fuentes elegidas; se conservan al guardar, reabrir y recuperar borradores, sin sustituirlas por las del diseño.

Apariencia conserva las seis combinaciones originales e incluye doce paletas de colores básicos. La opción «Los colores de tu foto» analiza en el navegador la fotografía de fondo del apartado Fotografías, toma su tono predominante y genera tonos coordinados con una base oscura para mantener la legibilidad. Requiere una foto accesible; los errores permiten reintentar sin cambiar la selección. El color obtenido se guarda en el campo de color existente y su combinación se reconstruye al reabrir y publicar. El análisis no requiere un servicio externo adicional.

Los borradores nuevos utilizan `content-v4` y recuerdan el detalle que se estaba editando, o si los ajustes de apariencia estaban abiertos. Los recorridos anteriores se convierten a la pantalla correspondiente al recuperarlos. Los enlaces de corrección distinguen protagonistas, fecha y lugar, y cada sección concreta. Las fuentes sugeridas se aplican a nuevos eventos según su tipo; los valores guardados o personalizados se conservan.

Fotografías muestra siempre la portada y el fondo: dos tarjetas compactas lado a lado en escritorio y apiladas en móvil. Los formatos y el límite de tamaño se indican una sola vez. En esta pantalla solo se usa Continuar; Contenido también usa únicamente Continuar, que pasa de un detalle al siguiente y lleva a las opciones adicionales al final.

El paso de Contenido ya no tiene un desglose general de secciones. Los detalles recomendados permanecen en el recorrido aunque se desactiven, para poder volver a incluirlos al retroceder. «¿Quieres agregar algo más?» muestra solo las opciones que todavía no están incluidas. Una opción añadida se edita de forma individual y al continuar vuelve a esa pantalla, sin repetir los detalles revisados. La recuperación conserva también este punto del recorrido.

El paso 4 incluye un resumen «Tu invitación» con el número y los títulos de las secciones activadas. La que se está editando se resalta y cada título permite abrir su editor directamente. El resumen se actualiza al incluir, excluir, añadir o renombrar una sección; no añade controles de selección ni cambia los textos guardados.

Revisa tu invitación (paso 6) también muestra las secciones elegidas, su contador y accesos para editar cada sección directamente en el paso 4. Las secciones desactivadas no aparecen en el resumen final.

El ojo junto al selector Móvil guarda los cambios actuales y abre `/dashboard/eventos/[id]/show` en otra pestaña. Si el evento todavía no existe, se prepara su borrador antes de guardar. Un error de guardado conserva el editor y muestra el motivo; si el navegador bloquea la pestaña nueva, la vista se abre en la actual. Este acceso es privado y no requiere publicar la invitación.
