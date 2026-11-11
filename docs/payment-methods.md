# PayPal, Mercado Pago y OXXO

La pantalla de pago ofrece los proveedores configurados en el servidor. Todos
conservan el importe y la moneda de la compra y publican únicamente después de
consultar el pago confirmado con las credenciales del comercio. Los parámetros
de retorno del navegador no acreditan pagos. No se requieren claves públicas ni
se almacenan datos de tarjeta.

## Base de datos

Antes de desplegar el código, aplicar la migración aditiva:

```sh
npx prisma migrate deploy
npx prisma generate
```

`InvitationPayment.provider` distingue `stripe`, `paypal` y `mercadopago`.
Las compras existentes reciben `stripe` automáticamente. Las referencias nuevas
se guardan en `providerCheckoutId` y `providerPaymentId` con prefijo del proveedor.
Las columnas históricas de identidad del **evento** (`stripePaymentIntentId` y
`renewalOfPaymentIntentId`) también aceptan esa referencia con prefijo para
conservar las reglas de compra vigente y renovación. Las columnas Stripe de la
**compra** siguen siendo exclusivamente de Stripe.

## PayPal

Configurar en el servidor:

```dotenv
PAYPAL_ENVIRONMENT="sandbox"
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
PAYPAL_WEBHOOK_ID="..."
```

Crear una aplicación REST y registrar el webhook HTTPS
`https://TU-DOMINIO/api/paypal/webhook` en esa misma aplicación. Suscribirse a
`CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`,
`PAYMENT.CAPTURE.PENDING`, `PAYMENT.CAPTURE.DECLINED`, `PAYMENT.CAPTURE.REFUNDED`,
`PAYMENT.CAPTURE.REVERSED` y `CUSTOMER.DISPUTE.CREATED`,
`CUSTOMER.DISPUTE.UPDATED`, `CUSTOMER.DISPUTE.RESOLVED`,
`PAYMENT.REFUND.PENDING` y `PAYMENT.REFUND.FAILED`.

Para Payments v2, el rechazo corresponde a `PAYMENT.CAPTURE.DECLINED`.
`CHECKOUT.ORDER.COMPLETED` está reservado para marketplaces y plataformas; no es
necesario en esta aplicación Merchant. Ver los
[eventos oficiales de PayPal](https://developer.paypal.com/api/rest/webhooks/event-names/).
Los dos eventos `PAYMENT.REFUND.*` actualizan reembolsos pendientes o fallidos;
se consulta su estado actual por ID y se verifica la captura a la que pertenecen.
El manejador admite además `CHECKOUT.PAYMENT-APPROVAL.REVERSED` como evento
complementario. PayPal lo describe en su
[integración de métodos de pago alternativos](https://developer.paypal.com/payment-methods/webhooks/).
El checkout actual utiliza `payment_source.paypal`; si ese evento no aparece en
el panel, guardar los otros once y continuar. No es un requisito para este flujo.
Cuando se recibe, marca un intento sin captura como fallido y evita que una
notificación de aprobación atrasada vuelva a intentar cobrarlo.
La lista de once cubre el cobro único y su seguimiento financiero; no incluye suscripciones,
facturación, pagos a terceros ni almacenamiento de métodos de pago.

El servidor crea una orden con intención `CAPTURE`; al aprobarla, el retorno
autenticado o el webhook la captura. La orden guardada, sus referencias y el
importe se verifican antes de capturar. Solo una captura confirmada publica.
Las órdenes nuevas solicitan `payment_source.paypal.experience_context.landing_page="LOGIN"`
para comenzar con el acceso a la cuenta de PayPal, en lugar de dejar que PayPal
elija inicialmente el formulario de tarjeta como invitado. Los enlaces de órdenes
ya creadas se conservan hasta vencer y mantienen sus parámetros originales.
En Sandbox, iniciar sesión con una cuenta **Personal de prueba** de Testing Tools
→ Sandbox Accounts; las cuentas y tarjetas reales están separadas del entorno de
pruebas. En producción el comprador puede iniciar sesión en su cuenta real y
elegir entre los medios de pago que PayPal le ofrezca.
Una orden aún sin capturar después de la ventana de una hora necesita iniciar
otro intento; no se captura fuera de esa ventana. Una captura ya realizada se
concilia aunque llegue tarde. Las notificaciones se verifican con la API de
firmas de PayPal y el ID del webhook.

Para producción, cambiar a `PAYPAL_ENVIRONMENT="live"` y usar credenciales e ID
de webhook de producción. Los webhooks deben poder recibirse públicamente;
en desarrollo usar un túnel HTTPS y una cuenta compradora sandbox diferente de
la cuenta vendedora.

## Mercado Pago

```dotenv
MERCADOPAGO_ENVIRONMENT="sandbox"
MERCADOPAGO_ACCESS_TOKEN="..."
MERCADOPAGO_WEBHOOK_SECRET="..."
```

Registrar `https://TU-DOMINIO/api/mercadopago/webhook` en Webhooks de la aplicación,
activar notificaciones de tipo **payment** y copiar la firma secreta. Usar
Checkout Pro mediante Preferences API. La notificación debe incluir `data.id`,
`x-signature` y `x-request-id`. No usar IPN: esta integración exige firma HMAC.
`APP_URL` debe ser una URL HTTPS pública para pruebas completas con notificaciones.

Se crea una preferencia con referencia interna e importe inmutables y vencimiento
de una hora. Se reutiliza durante esa ventana, incluso si cambia el precio del
catálogo: el importe contratado se muestra en el checkout y en el recibo.
Los pagos `pending`/`in_process` no publican; `approved` sí. La consulta comprueba
también `live_mode`. Los reembolsos se reflejan y los contracargos suspenden el
acceso. Se excluyen fichas de efectivo y cajeros en Mercado Pago porque el flujo
de efectivo se ofrece mediante OXXO en Stripe.

En pruebas usar usuarios y credenciales de prueba compatibles con Checkout Pro
de la cuenta. Cambiar a `MERCADOPAGO_ENVIRONMENT="live"` con el access token y la
firma de producción al terminar las pruebas.

## OXXO con Stripe

Conservar las claves y los eventos descritos en [stripe.md](stripe.md). Activar
OXXO en los métodos de pago de Stripe Dashboard y configurar:

```dotenv
STRIPE_OXXO_ENABLED="true"
```

Los nuevos Checkouts en MXN ofrecen tarjeta y OXXO. Las fichas vencen en un día.
La opción elegida se guarda al reservar el intento para que un reintento use
exactamente los mismos parámetros idempotentes. Checkouts anteriores mantienen
sus opciones originales hasta vencer. En renovaciones, OXXO se oculta si quedan
menos de cuatro días adicionales tras el vencimiento del Checkout para que la
ficha y su confirmación tengan margen antes de eliminar la invitación.

Generar la ficha no publica. `checkout.session.completed` puede seguir pendiente;
`checkout.session.async_payment_succeeded` confirma la publicación. Stripe indica
que la confirmación llega hasta el siguiente día hábil después del depósito.
OXXO no admite reembolsos desde Stripe: soporte debe resolverlos por separado.

## Comprobación

```sh
node --test tests/stripe-payment.test.cjs tests/payment-providers.test.cjs
npm run typecheck
```

Las pruebas no cobran ni llaman a proveedores reales. Antes de vender, verificar
en sandbox una compra por proveedor, una ficha OXXO pendiente y pagada, retorno
cancelado, entrega repetida, retorno sin webhook, reembolso, disputa y renovación.
Para cada compra, comprobar Mis compras y la vigencia de la invitación. Aplicar
la migración y configurar las cuentas externas son requisitos para activar pagos.

Referencias oficiales: [PayPal Orders v2](https://developer.paypal.com/api/orders/v2),
[webhooks de Mercado Pago](https://www.mercadopago.com.mx/developers/en/docs/checkout-pro-preferences/payment-notifications),
[OXXO en Stripe](https://docs.stripe.com/payments/oxxo).
