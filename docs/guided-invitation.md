# Editor compartido de invitaciones

`/crear` muestra primero el tipo de celebración. No crea un evento en el servidor hasta guardar el borrador o subir una fotografía. Todos los tipos abren `GuidedInvitationEditor` con seis pasos: protagonistas, fecha y lugar, fotografías, contenido, apariencia y revisión.

La vista previa, la vista privada y la invitación pública utilizan `CelebrationInvitation`. El diseño base está definido en `lib/shared-invitation.ts`; no hay selector de diseños ni texturas. Cada organizador puede elegir colores, fuentes, fotos, orden de las fotografías y acabado de los paneles.

`lib/guided-invitation.ts` adapta textos, secciones y validación según el tipo de evento. Los ejemplos ficticios nunca se copian a las invitaciones reales. Las secciones personalizadas y las opciones desactivadas se conservan al reabrir o recuperar un borrador. Las confirmaciones antiguas sin modo explícito conservan el modo externo.

Los requisitos de publicación se comprueban en el asistente, el servidor y el pago para todos los eventos: protagonistas o anfitriones, fecha, hora, lugar, dirección y secciones activas completas. Guardar un borrador incompleto continúa permitido.

La revisión incluye la elección de acceso público o protegido con PIN. No tiene un botón independiente de guardado: **Guardar borrador**, **Guardar cambios**, **Guardar y salir** y **Continuar al pago** guardan el contenido y la privacidad en una sola transacción. El paso de pago requiere una elección explícita y un PIN válido cuando corresponde. La revisión muestra la opción elegida y permite copiar el PIN nuevo antes de continuar. Los cambios de privacidad desde Ajustes conservan su formulario dedicado.

Los borradores pueden conservar la privacidad sin elegir. Si se elige protección con PIN hay que completar seis dígitos para guardar esa configuración. Cambiar el PIN o pasar a acceso público revoca las sesiones de invitados anteriores. Se comprueban las versiones del contenido y de la privacidad para evitar sobrescribir cambios de otra pestaña, también al continuar al pago.

La protección al salir, el autoguardado de borradores, la recuperación local y la detección de conflictos se describen en [protección del editor](editor-protection.md). El comportamiento visual y el recorrido detallado están en [presentación compartida](shared-invitation.md).
