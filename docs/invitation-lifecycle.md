# Vigencia, archivo y renovación

Cada pago confirmado activa doce meses naturales. Se calculan desde la fecha
del cargo verificado con Stripe; repetir un webhook o guardar contenido no añade
tiempo. El 29 de febrero se ajusta al último día de febrero del siguiente año.
Las compras existentes conservan su `expiresAt` original.

Ajustes y Pago y soporte muestran días completos transcurridos, días restantes,
vencimiento y una barra de progreso. El contador se actualiza cada minuto.
Las fechas visibles usan la zona de Ciudad de México; los límites se comparan
como instantes UTC en el servidor.

Al llegar a `expiresAt`, el enlace público, RSVP, edición, ajustes y nuevas cargas
de imágenes dejan de estar disponibles. Se conserva el contenido un mes natural
adicional; los días inexistentes se ajustan al último día del mes. Este límite
se aplica aunque el scheduler todavía no haya escrito `ARCHIVED`.

Durante el archivo se puede comprar otro año al precio vigente desde Pago y
soporte. No hay cobros automáticos. La reserva guarda el PaymentIntent anterior
en `InvitationPayment.renewalOfPaymentIntentId`: solo ese intento puede sustituir
el periodo anterior. El nuevo año empieza con el cargo confirmado y conserva
el contenido, las respuestas, el PIN y los enlaces. Los avisos atrasados de la
compra anterior no afectan al nuevo acceso. Un reembolso o disputa de la compra
vigente sí mantiene los controles existentes. No se ofrecen renovaciones de
invitaciones reembolsadas, suspendidas ni de cortesías.

Checkout requiere al menos 31 minutos disponibles para iniciar una sesión; su
caducidad nunca supera el fin del archivo. La pantalla informa cuando ya no es
posible iniciar un pago. Si se pierde un webhook, volver a la pantalla de pago
o ejecutar la limpieza concilia la sesión guardada antes de retirar el contenido.

## Activación

1. Aplicar la migración `20261109000001_invitation_lifecycle` mediante
   `npx prisma migrate deploy` y ejecutar `npx prisma generate`.
2. Configurar `CRON_SECRET` en el servidor.
3. Activar el scheduler existente de `workers/cloudinary-cleanup/` o un servicio
   equivalente: cada cinco minutos debe invocar `GET /api/internal/cloudinary/cleanup`
   con `Authorization: Bearer <CRON_SECRET>`. Ver `cloudinary-storage.md`.

La ruta ejecuta `runInvitationLifecycle` y después la cola de Cloudinary. Archiva
las publicaciones vencidas y examina hasta diez candidatos para eliminar por
ejecución. Cada eliminación vuelve a leer y bloquear el evento y la cuenta:
una renovación concurrente no debe perder el contenido ni descontar dos veces
el espacio. Se eliminan el evento y sus relaciones en cascada (respuestas,
presupuestos, sesiones PIN y enlaces); las fotos se encolan en la misma
transacción. La cola sobrevive al evento y reintenta los fallos del proveedor.
Los registros de compras se conservan independientemente.

Los borradores sin compra y los ejemplos están excluidos. Las invitaciones
suspendidas o reembolsadas también se eliminan al cumplir su fecha de conservación.
Las cortesías conservan su vencimiento otorgado y el mismo mes de archivo.
Ante un pago pendiente se consulta Stripe primero. Si la verificación falla, la
invitación se conserva y la ruta devuelve 500 para reintentar. La eliminación
ocurre en la siguiente ejecución exitosa después del límite, sin requerir visitas.
El repositorio contiene el Worker; desplegar la app no activa por sí solo su cron.

La eliminación no cubre copias externas ni respaldos de proveedores. No modifica
la política independiente de cierre de cuentas o retención del historial comercial.

## Verificación

`node --test tests/invitation-lifecycle.test.cjs tests/stripe-payment.test.cjs`
comprueba fechas límite, años bisiestos, permisos, renovaciones idempotentes,
avisos atrasados, eliminación y conservación ante fallos de verificación. Usa
servicios aislados, sin cobros ni eliminación de invitaciones reales.

`node tests/invitation-lifecycle.postgres.cjs` comprueba bloqueos, renovaciones
simultáneas, eliminación en cascada y cola de fotos con PostgreSQL real. Crea y
elimina una cuenta desechable; todas las consultas de limpieza se limitan a ella.
Stripe y Cloudinary permanecen simulados.
