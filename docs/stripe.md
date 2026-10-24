# Pago y publicación con Stripe

El editor y la vista previa son privados. Publicar y compartir requieren un pago
confirmado. El precio actual es $499 MXN por evento, con 12 meses de vigencia y
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
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to localhost:3000/api/stripe/webhook
```

Usa el secreto `whsec_...` que imprime ese comando y reinicia `npm run dev`.
Prueba desde el botón de pago del editor con los datos de prueba de Stripe.
Una vuelta a `?payment=received` no acredita el pago por sí sola: el servidor
consulta a Stripe usando la sesión guardada del evento y verifica importe,
moneda, estado y propietario. Esto recupera pagos confirmados cuyo webhook no
llegó. La recuperación y el webhook comparten la misma actualización atómica.

## Producción

Configura `APP_URL` con el origen HTTPS del sitio y una clave secreta de producción.
Registra un webhook HTTPS en `/api/stripe/webhook` para los dos eventos anteriores.
Usa su secreto de firma de producción, distinto del secreto de Stripe CLI.

El webhook verifica firma, entorno, importe, moneda y metadatos del evento y su
propietario. Solo un pago `paid` habilita la invitación. Su actualización es
atómica: las entregas duplicadas no extienden la vigencia. Los errores temporales
devuelven 500 para que Stripe vuelva a intentar la entrega.

Las invitaciones anteriores no se consideran pagadas por tener estado publicado:
la migración las deja pendientes de pago, conservando contenido y slug. No hay
botón ni parámetro de URL que permita simular un pago. La renovación, reembolsos
y disputas no están implementados en este flujo inicial.

## Comprobaciones

```sh
node --test tests/stripe-payment.test.cjs
```

Estas pruebas usan el verificador real de firmas de Stripe y una base de datos
aislada en memoria, sin cobros ni solicitudes a Stripe.

Referencias: [Checkout](https://docs.stripe.com/checkout/fulfillment),
[verificación de webhooks](https://docs.stripe.com/events/manage-webhook-endpoints).
