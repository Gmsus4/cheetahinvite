# Pago y publicación con Stripe

Para PayPal, Mercado Pago y la configuración de OXXO, consulta
[payment-methods.md](payment-methods.md).

El editor y la vista previa son privados. Publicar y compartir requieren un pago
confirmado. El precio actual es $269 MXN por evento, IVA incluido, con 12 meses de vigencia y
sin renovación automática. El importe está centralizado en `lib/invitation-payment.ts`.

## Configuración local

Configura en `.env` (nunca en variables `NEXT_PUBLIC_`):

```dotenv
APP_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Con Stripe CLI autenticada en tu cuenta, ejecuta:

```sh
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,charge.refunded,refund.created,refund.updated,refund.failed,charge.dispute.created,charge.dispute.updated,charge.dispute.closed,charge.dispute.funds_withdrawn,charge.dispute.funds_reinstated --forward-to localhost:3000/api/stripe/webhook
```

Usa el secreto `whsec_...` que imprime ese comando y reinicia `npm run dev`.
Prueba desde el botón de pago del editor con los datos de prueba de Stripe.
Una vuelta a `?payment=received` no acredita el pago por sí sola: el servidor
consulta a Stripe usando la sesión guardada del evento y verifica importe,
moneda, estado y propietario. Esto recupera pagos confirmados cuyo webhook no
llegó. La recuperación y el webhook comparten la misma actualización atómica.

## Producción

Configura `APP_URL` con el origen HTTPS del sitio y una clave secreta de producción.
Registra un webhook HTTPS en `/api/stripe/webhook` para todos los eventos anteriores,
con formato snapshot y una versión de API compatible con el SDK instalado.
Usa su secreto de firma de producción, distinto del secreto de Stripe CLI.

El webhook verifica firma, entorno, importe, moneda y metadatos del evento y su
propietario. Solo un pago `paid` habilita la invitación. Su actualización es
atómica: las entregas duplicadas no extienden la vigencia. Los errores temporales
devuelven 500 para que Stripe vuelva a intentar la entrega.

`InvitationPayment` conserva cada intento con importe y moneda originales,
nombre de la invitación, referencias de Stripe, vigencia, reembolsos y disputas.
Las compras anteriores conservan el importe contratado. Si se reabre desde la
aplicación un Checkout aún pendiente con el precio anterior, primero se vence
esa sesión y después se genera otra al precio actual; un pago ya completado
se recupera sin volver a cobrar. No se reescribe el historial de compras.
No tiene relaciones con borrado en cascada: el historial sobrevive al contenido.
La migración importa las sesiones existentes; su modo y estado financiero se
verifican con Stripe al recibir una notificación o actualizar desde Mis compras.
No es posible reconstruir referencias ya borradas antes de esta migración.

Cada intento se reserva antes de abrir Checkout; pestañas simultáneas y respuestas
perdidas reutilizan la misma clave idempotente. Los intentos vencidos se conservan.
Se fija una caducidad de una hora para evitar crear otro Checkout pagable al
reintentar fuera de la retención de claves idempotentes de Stripe. Si una creación
queda sin respuesta durante más de media hora, puede requerir esperar a que venza
antes de volver a intentar. Cancelar la pantalla de Checkout no equivale a un reembolso.

La conciliación consulta Checkout, PaymentIntent, cargo y las listas completas de
reembolsos y disputas. Solo suma reembolsos `succeeded`; los pendientes o fallidos
no revocan acceso. El reembolso total retira el enlace, el parcial lo mantiene;
las disputas suspenden y las ganadas restauran la vigencia original. No se reactivan
invitaciones eliminadas, archivadas o vencidas. La compra vigente controla el
acceso: un segundo cargo accidental queda registrado para soporte y no añade meses.
Una renovación reservada durante el mes de archivo puede sustituir expresamente
la compra anterior y activar otro año. Ver `invitation-lifecycle.md`.

Las consultas y escrituras se serializan por compra con un bloqueo transaccional
en PostgreSQL. Esto evita que un aviso atrasado sobrescriba una consulta más nueva.
Un error de Stripe o de base de datos produce 500 y rollback; Stripe puede reintentar.
El cliente puede conciliar manualmente desde Mis compras, con una pausa de 30 s
entre verificaciones exitosas. No se guardan datos de tarjeta ni payloads completos.
La renovación manual está disponible durante el mes de archivo. La ejecución de
reembolsos y la resolución de disputas corresponden al equipo autorizado en Stripe.

## Comprobaciones

```sh
node --test tests/stripe-payment.test.cjs
node tests/payment-operations.postgres.cjs
```

Estas pruebas usan el verificador real de firmas de Stripe y una base de datos
aislada en memoria, sin cobros ni solicitudes a Stripe. La segunda comprobación
usa la base de datos configurada con fixtures propios que elimina al terminar,
y un Stripe simulado: comprueba bloqueos, historial y rollback reales.

Antes de abrir ventas, probar además en Stripe Sandbox una compra desde el editor,
reembolsos parcial/total/fallido, disputa ganada/perdida y reenvíos de webhooks.
Las pruebas automatizadas no sustituyen esa comprobación de la configuración externa.

Referencias: [Checkout](https://docs.stripe.com/checkout/fulfillment),
[webhooks y orden de entregas](https://docs.stripe.com/webhooks),
[lista de reembolsos](https://docs.stripe.com/api/refunds/list),
[lista de disputas](https://docs.stripe.com/api/disputes/list).
