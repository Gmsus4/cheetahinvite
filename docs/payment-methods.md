# PayPal, Mercado Pago y OXXO

La pantalla de pago ofrece los proveedores configurados en el servidor. Todos
conservan el importe y la moneda de la compra y publican únicamente después de
consultar el pago confirmado con las credenciales del comercio. Los parámetros
de retorno del navegador no acreditan pagos. No se requieren claves públicas ni
se almacenan datos de tarjeta.

## URL local y URL de Vercel

Configurar `APP_URL="http://localhost:3000"` solo en el entorno local. En Vercel,
la variable del entorno Production debe ser `https://cheetahinvite.vercel.app`
(o el dominio público vigente). Después de cambiarla, desplegar de nuevo.
Esto es independiente de `PAYPAL_ENVIRONMENT="sandbox"`: un sitio público
también puede utilizar cuentas de prueba.

Cada intento guarda `checkoutOrigin`. Solo se reutiliza un enlace pendiente si
se creó con el mismo origen. Los intentos antiguos sin origen registrado se
consultan primero con el proveedor. Si el pago ya fue aprobado, capturado o
está en proceso, se concilia antes de abrir otro. Si sigue sin pagar, se retira
el intento y se crea otro con el retorno correcto. Los enlaces retirados de
PayPal no vuelven a capturarse al aprobarse tarde. Mercado Pago cancela y vuelve
a consultar la order anterior antes de reemplazarla; para intentos históricos
de Preferences vence primero la preferencia. Las comprobaciones se serializan con la conciliación.
Vercel rechaza una configuración de pagos que apunte a localhost o use HTTP.

Un retorno a localhost puede deberse a una variable incorrecta en el despliegue
o a la reutilización de una orden creada localmente contra la misma base de
datos. Corregirlo no elimina una restricción `COMPLIANCE_KYC_VIOLATION` de PayPal.

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

### Configuración inicial y cuentas

1. Entrar a Developers con la cuenta real que administra el negocio. En Tus
   integraciones crear una aplicación llamada **Cheetah Invite** y seleccionar
   **Checkout Pro → API de Orders**. Preferences muestra un aviso de retiro;
   las nuevas compras de este proyecto usan Orders.
2. En **Credenciales**, seleccionar **Prueba** y comprobar que el país de
   operación sea México. La cuenta real administra la aplicación y esta muestra
   por separado la cuenta de prueba asociada.
3. Copiar el **Access Token** del entorno **Prueba** de esa aplicación. En Orders
   comienza con `APP_USR-…`; el prefijo por sí solo no distingue pruebas de
   producción. Comprobar el selector de entorno antes de copiarlo.
4. En **Configuración de Webhooks → Prueba**, registrar
   `https://cheetahinvite.vercel.app/api/mercadopago/webhook`, activar
   **Order (Mercado Pago)** y copiar la **Firma secreta** al servidor.
   La aplicación valida `data.id`, `x-signature` y `x-request-id`; no usar IPN.
5. Configurar las tres variables anteriores en el servidor local y en Vercel,
   usando `sandbox` mientras se prueba. En Vercel guardar en el entorno que se
   despliega y volver a desplegar. `APP_URL` debe ser la URL HTTPS pública para
   recibir notificaciones sin un túnel.
6. Abrir una ventana de incógnito, acceder a Cheetah Invite e iniciar la compra
   desde la invitación. Iniciar sesión en Cheetah Invite si hace falta para abrir
   el evento, pero **no iniciar sesión en Mercado Pago**. La guía actual de
   [pruebas de Checkout Pro con Orders](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-orders/integration-test-introduction)
   indica que este flujo no necesita una cuenta de prueba compradora. Usar la
   [tarjeta de prueba para México](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-orders/integration-test/test-purchase-with-card),
   con titular `APRO` para simular aprobación. Revisar el pago, la publicación
   y el registro en Mis compras.

### Funcionamiento y compatibilidad

Se crea una order por `POST /v1/orders`, `type=online`, `processing_mode=manual`
y `capture_mode=automatic`. Mercado Pago procesa la captura en su checkout;
el proyecto no llama al endpoint manual de procesamiento. Cada creación envía
`X-Idempotency-Key` con el UUID interno. Se guarda `checkout_url`, la referencia,
el importe y el origen; se excluyen fichas y cajeros porque el efectivo se ofrece
mediante OXXO en Stripe. No se precarga el correo real del usuario como comprador
de pruebas. Las URLs de retorno se configuran en `config.online` y el webhook en
la aplicación de Mercado Pago.

La order vence en una hora y se reutiliza con el mismo importe durante esa
ventana. El servidor consulta `GET /v1/orders/{id}` tanto desde el retorno como
desde el webhook. Solo acredita `processed/accredited` o estados que prueban un
cobro previo, como un reembolso. `created`, `processing` y `action_required` no
publican. Se verifican ID guardado, referencia interna, moneda, importe pagado,
transacción y entorno (`live_mode` cuando existe, o el prefijo sandbox `ORDTST`).
La vigencia se ancla a `created_date`, timestamp inmutable que expone Orders, y
no cambia al recibir eventos repetidos o reembolsos posteriores.

Los reembolsos parciales conservan acceso; un reembolso completo o contracargo
suspende la publicación conforme a las reglas comunes de compras. Si falta el
detalle financiero necesario, la notificación devuelve error para reintentarse.
Las compras históricas de Preferences conservan la consulta de Payments y el
webhook `payment`; no se crean nuevas preferencias.
En Payments, se observó que pagos de un vendedor `test_user` autenticado con
`APP_USR` pueden devolver `live_mode=true`. Para compras guardadas como sandbox,
esa diferencia solo se acepta si `/users/me` confirma la etiqueta `test_user`
y su ID coincide con el `collector_id` del pago. Un vendedor real, otro receptor
o una consulta de identidad fallida no habilitan la excepción.

Al pasar a cobros reales, usar `MERCADOPAGO_ENVIRONMENT="live"`, credenciales del
vendedor real y el webhook de **Producción**, y desplegar de nuevo. Las pruebas
automatizadas simulan la API; no sustituyen una compra completa con las credenciales
y las tarjetas de prueba de la aplicación.

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
[Checkout Pro con Orders](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-orders/create-order),
[webhooks de Mercado Pago](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-orders/notifications),
[OXXO en Stripe](https://docs.stripe.com/payments/oxxo).
