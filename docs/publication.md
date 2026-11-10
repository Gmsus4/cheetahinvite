# Cierre de publicación

La pantalla de pago muestra las acciones de envío únicamente cuando `isInvitationPublished` confirma que la invitación está activa. Los parámetros de la URL no bastan para mostrar éxito. Se conserva la verificación del pago y la actualización automática existentes mientras espera confirmación. Las cortesías publicadas reciben las mismas acciones sin atribuirles un pago.

`PublicationReady` reúne el enlace definitivo, **Copiar enlace**, **Enviar por WhatsApp** y **Ver invitación**. WhatsApp abre un mensaje preparado con el nombre y la URL; el organizador elige el destinatario y envía. No se envían mensajes automáticamente. Si falla el portapapeles, el campo permite seleccionar y copiar manualmente el enlace.

Las invitaciones privadas muestran un recordatorio de compartir el PIN y acceso a Ajustes para cambiarlo. Este componente no recibe el hash ni el PIN, y el mensaje preparado no los incluye.

El bloque de confirmación activo determina el siguiente paso: **Ver respuestas** para confirmaciones integradas; explicación del número configurado para WhatsApp o del servicio externo en los demás casos. Cuando el bloque está desactivado se ofrece volver al editor para configurarlo. La confirmación integrada enlaza a la lista de respuestas aunque todavía esté vacía.

Verificación: `tests/publication-next-steps.test.cjs`, suite completa y revisión de escritorio y móvil en la pantalla real mediante eventos temporales. No requiere realizar una compra para comprobar el diseño.
