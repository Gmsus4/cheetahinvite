# Soporte y operación de compras

## Canal y recepción

El canal es `cheetahinvite@gmail.com`. `/ayuda` prepara un correo con motivo,
correo de la cuenta, referencia opcional y descripción. Desde la pantalla de
pago la referencia y el correo se completan con la invitación del usuario
autenticado. El dashboard ofrece un correo preparado por invitación.

El cliente debe revisar y enviar el mensaje. No hay envío automático, sistema
de tickets ni plazo de respuesta prometido. Las referencias permiten ubicar
una invitación; no prueban propiedad ni autorizan cambios.

## Procedimiento común

1. Identificar la cuenta y el evento. Comprobar que el solicitante tiene acceso
   al correo registrado antes de divulgar datos o realizar cambios sensibles.
2. Localizar el pago en Stripe mediante el identificador de evento en
   `client_reference_id` o los metadatos `eventId` y `ownerId`. La base de datos
   guarda `stripeCheckoutSessionId` y, al acreditar, `stripePaymentIntentId`.
3. Revisar si se trata de pruebas o producción, importe, moneda, fecha, estado
   real del pago y relación con el evento. No acreditar mediante una captura,
   una URL de retorno o un correo como única evidencia.
4. Registrar en la conversación el resultado y la acción aplicada, sin incluir
   contraseñas, tokens, claves de Stripe ni datos completos de tarjeta.
5. Responder al correo registrado con la resolución o los datos que faltan.

## Cobro confirmado sin publicación

- Verificar el estado pagado en Stripe y que corresponde a la cuenta y evento.
- Revisar las entregas del webhook y sus errores; la publicación es idempotente.
- Reintentar la entrega válida desde Stripe o usar el flujo autenticado de
  recuperación de pago existente. No pedir un segundo pago ni editar `paidAt`
  para simular un cobro.
- Confirmar publicación, enlace y vigencia; después informar al cliente.

## Posible cobro duplicado

- Distinguir pagos confirmados de intentos fallidos, cancelados o autorizaciones
  pendientes. Reunir los identificadores de cada operación antes de actuar.
- Si hay dos cobros confirmados para la misma compra, investigar su origen y
  decidir la resolución con el responsable. Evitar emitir dos reembolsos por
  atender dos veces el mismo correo.

## Acceso y edición

Comprobar cuenta propietaria, método de acceso, estado y vigencia del evento.
Los borradores no son públicos. Si el problema es la contraseña, usar el flujo
de recuperación, sin pedir credenciales al cliente.

## Solicitudes de reembolso

El formulario recibe solicitudes, no las aprueba ni ejecuta. La política
comercial acordada contempla fallas atribuibles a Cheetah Invite que impidan
prestar el servicio, incluidos cobros duplicados por error del sistema. No se
ofrece devolución comercial por cambio de opinión, errores de contenido del
usuario o eliminación voluntaria, sin excluir derechos legales irrenunciables.
Comprobar la operación y la falla antes de aprobar; comunicar resultado e importe
y no prometer fechas bancarias. Falta asignar al responsable de aprobación.

La app todavía no sincroniza reembolsos o disputas de Stripe con la publicación
local. Si se autoriza un reembolso, el responsable debe registrar la operación
y determinar expresamente qué ocurre con la invitación, con seguimiento técnico
del estado local. No asumir que reembolsar en Stripe despublica la invitación.
No eliminar una invitación como sustituto de un reembolso.

## Pendientes antes de abrir ventas

- Confirmar precio definitivo; los importes del código actual no representan
  una decisión comercial final.
- Asignar responsables de reembolsos y determinar el estado de publicación tras
  reembolsos o disputas; completar los datos de identidad de los textos legales.
- Comprobar acceso del equipo al buzón y a Stripe con permisos adecuados.
- Probar cobro, cancelación, webhook repetido y recuperación de una entrega
  fallida usando exclusivamente el entorno de pruebas de Stripe.

No se crea un panel administrativo ni se automatizan movimientos de dinero
con esta implementación.
