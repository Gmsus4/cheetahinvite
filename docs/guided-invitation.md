# Editor compartido de invitaciones

`/crear` muestra primero la selección de tipo de celebración. No se crea un evento en el servidor hasta guardar el borrador o subir una fotografía. Todos los tipos abren `GuidedInvitationEditor`: diseño, datos principales, personalización y revisión, con la misma protección de borradores, vista previa móvil/escritorio, recuperación y manejo de conflictos.

Boda mantiene sus doce identidades; cumpleaños ofrece Confeti, Globos pastel, Neón, Disco y la composición esencial. Los demás eventos utilizan los diseños disponibles de su catálogo y la composición esencial. No se anuncian plantillas sin recursos como opciones disponibles.

`lib/guided-invitation.ts` adapta textos, secciones, paletas y validación según el tipo. Los datos de demostración nunca se copian a las invitaciones reales. Las invitaciones anteriores conservan su plantilla, contenido, color y modo de confirmación; una confirmación antigua sin modo explícito conserva el enlace externo.

Los requisitos de publicación para los eventos distintos de boda se comprueban tanto en el asistente como en publicación y pago: protagonista/anfitrión, fecha, hora, lugar, dirección y secciones activas completas. Boda conserva la validación de sus identidades versionadas. Guardar un borrador incompleto continúa permitido.

El contexto completo y la guía de continuidad se encuentran en [README-DISENOS.md](../README-DISENOS.md). Los selectores usan `InvitationDesignGrid` para mantener el mismo grid en todos los tipos de evento.
