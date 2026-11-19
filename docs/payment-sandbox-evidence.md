# Evidencia de pagos en sandbox

Registro abierto el **18 de noviembre de 2026**. Entorno previsto: staging.
Cada ejecución debe indicar el entorno y la URL de la aplicación donde ocurrió;
una prueba local o de otro despliegue no acredita la configuración de staging.

El propietario indicó que ya realizó algunas pruebas y que tiene disponible el
panel de Stripe. Todavía no se han relacionado esas pruebas con casos, compras,
notificaciones o capturas en este registro. **Sin evidencia registrada no significa
que la prueba no se haya ejecutado.** No repetir una compra solo para llenar esta
tabla si se puede recuperar su evidencia existente.

## Seguimiento

| Caso | Proveedor | Recorrido | Estado de evidencia | Registro |
| --- | --- | --- | --- | --- |
| STR-01 | Stripe | Pago aprobado | Por documentar | Pendiente |
| STR-02 | Stripe | Cancelación del checkout | Por documentar | Pendiente |
| STR-03 | Stripe | Webhook repetido | Por documentar | Pendiente |
| STR-04 | Stripe | Reembolso | Por documentar | Pendiente |
| STR-05 | Stripe | Renovación manual | Por documentar | Pendiente |
| PP-01 | PayPal | Pago aprobado | Sin evidencia registrada | Pendiente |
| PP-02 | PayPal | Cancelación del checkout | Sin evidencia registrada | Pendiente |
| PP-03 | PayPal | Webhook repetido | Sin evidencia registrada | Pendiente |
| PP-04 | PayPal | Reembolso | Sin evidencia registrada | Pendiente |
| PP-05 | PayPal | Renovación manual | Sin evidencia registrada | Pendiente |
| MP-01 | Mercado Pago | Pago aprobado | Sin evidencia registrada | Pendiente |
| MP-02 | Mercado Pago | Cancelación del checkout | Sin evidencia registrada | Pendiente |
| MP-03 | Mercado Pago | Webhook repetido | Sin evidencia registrada | Pendiente |
| MP-04 | Mercado Pago | Reembolso | Sin evidencia registrada | Pendiente |
| MP-05 | Mercado Pago | Renovación manual | Sin evidencia registrada | Pendiente |

Estados del registro: `Por documentar`, `Sin evidencia registrada`,
`Evidencia incompleta`, `Verificado`, `Fallido`. Solo usar `Verificado` después
de correlacionar los datos del proveedor con la compra, la invitación y el
resultado en la aplicación. Una firma válida, un HTTP 200 o una vuelta desde
Checkout por sí solos no bastan.

## Recuperar pruebas existentes

1. Localizar la compra en **Mis compras** o en el registro `InvitationPayment`.
   Tomar `id` y `eventId`, proveedor, importe y moneda, y sus referencias externas.
   No copiar la fila completa: contiene campos que no hacen falta en la evidencia.
2. Localizar la misma operación en el panel de pruebas del proveedor por su
   referencia. Confirmar que pertenece a sandbox, su estado y la fecha real.
3. Consultar la entrega del webhook al endpoint del despliegue probado. Registrar
   el ID de notificación, cada intento de entrega, fecha y HTTP respondido por
   la aplicación. Un ID de pago no sustituye al ID de notificación.
4. Recuperar los estados y fechas anteriores de evidencia contemporánea, si existe.
   La fila actual no permite reconstruir por sí sola el estado previo. Si no hay
   evidencia anterior, escribir `No disponible` y dejar el caso incompleto;
   no inventar valores ni presentar una captura actual como captura histórica.
5. Adjuntar capturas depuradas del proveedor y la aplicación. Indicar cuándo se
   tomaron; una captura recuperada hoy puede apoyar el estado actual, pero no
   demuestra por sí sola una transición pasada.

## Registro por ejecución

Copiar esta ficha por cada caso y enlazarla desde la tabla. Si hay varias
ejecuciones, conservarlas por separado. Escribir `No disponible` cuando falta
evidencia y `No aplica: motivo` cuando el flujo no genera ese dato.

```markdown
### STR-01 / ejecución 01

- Proveedor: Stripe | PayPal | Mercado Pago
- Caso: pago aprobado | cancelación | webhook repetido | reembolso | renovación
- Resultado: Evidencia incompleta | Verificado | Fallido
- Fecha y hora de la prueba, con zona horaria:
- Entorno y origen de la aplicación:
- Confirmación de sandbox del proveedor:
- ID de invitación (Event.id):
- ID de compra (InvitationPayment.id):
- Referencias externas de checkout/orden, pago/captura y reembolso, si aplica:
- Importe y moneda de la compra; importe reembolsado, si aplica:

| Notificación | Tipo | Intento de entrega | Fecha y hora con zona | Endpoint de la app | HTTP recibido por el proveedor |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

| Dato | Antes | Después |
| --- | --- | --- |
| Fecha y hora de observación, con zona | | |
| Estado en el proveedor | | |
| Estado de compra (InvitationPayment.status) | | |
| Estado de invitación (Event.status) | | |
| Compra: paidAt / expiresAt | | |
| Invitación: paidAt / expiresAt | | |
| Referencia del pago vigente (Event.stripePaymentIntentId) | | |
| refundedAmount / refundPendingAmount | | |
| Acceso al enlace público | | |

- Capturas del proveedor: [antes](ruta) / [después](ruta)
- Capturas de la aplicación: [antes](ruta) / [después](ruta)
- Fecha y hora de cada captura, con zona:
- Fuente de los estados anteriores, si se recuperaron de una prueba existente:
- Resultado observado y diferencias frente al esperado:
- Evidencia faltante o limitaciones:
```

Las referencias externas de Stripe están en `stripeCheckoutSessionId`,
`stripePaymentIntentId` y `stripeChargeId`; las de PayPal y Mercado Pago en
`providerCheckoutId` y `providerPaymentId`. Las referencias externas de estos dos
últimos se guardan con el prefijo del proveedor. La columna histórica
`Event.stripePaymentIntentId` identifica también pagos vigentes de esos proveedores.

En **webhook repetido**, incluir las dos entregas de la misma notificación,
sus HTTP y los estados inmediatamente antes y después del reenvío. Deben
permanecer la compra vigente y las fechas de vigencia; no debe aparecer otro
cobro. No usar dos notificaciones diferentes como prueba de entrega duplicada.

En **renovación**, registrar también el ID y la referencia de la compra anterior,
su vigencia, y `renewalOfPaymentIntentId` de la compra nueva. La renovación es
manual y se ofrece durante el mes de archivo. Documentar cualquier preparación
de la vigencia de una invitación de prueba; no presentarla como paso del tiempo
real ni modificar compras ajenas para generar el caso.

## Qué debe demostrar cada caso

| Recorrido | Resultado que se debe contrastar con la aplicación |
| --- | --- |
| Pago aprobado | Pago confirmado por el proveedor, compra acreditada, invitación publicada y fechas de vigencia guardadas. |
| Cancelación del checkout | Volver sin pagar no acredita esa compra ni publica por ese intento. No equivale a reembolso ni obliga a que la compra pase inmediatamente a EXPIRED o FAILED. Registrar la situación previa si la invitación ya tenía otra compra vigente. Si no se genera webhook, explicar `No aplica` en notificación y HTTP. |
| Webhook repetido | Misma notificación entregada al menos dos veces, ambas respuestas registradas, sin otro cobro ni extensión de vigencia por la repetición. |
| Reembolso | Identificar si es parcial o total y su estado en el proveedor. Solo el importe confirmado afecta al acceso: el parcial mantiene la publicación dentro de vigencia; el total retira el enlace. Distinguirlo de uno pendiente o fallido. |
| Renovación manual | Nueva compra confirmada que referencia la anterior, pasa a ser la vigente y activa un nuevo periodo de 12 meses. Conservar la evidencia de ambas compras. |

## Capturas y datos excluidos

Guardar las capturas depuradas en una carpeta por ejecución, por ejemplo
`payment-evidence/2026-11-18/STR-01/ejecucion-01/`, dentro del almacenamiento de
evidencia que use el proyecto, y enlazar sus archivos desde la ficha. Conservar
los identificadores necesarios para relacionar proveedor y aplicación.

Excluir secretos, tokens, firmas de autenticación, cookies, credenciales,
cadenas de conexión y **todos los datos de tarjeta**, incluidos número de prueba,
últimos dígitos, vencimiento y CVC. Recortar u ocultar esos campos antes de guardar
las capturas. Excluir también correos y otros datos personales que no hagan falta.
No adjuntar archivos de entorno, HAR, headers de autenticación ni payloads completos.

Este registro no contiene todavía evidencia de una compra completa. La
[verificación del despliegue](cloudflare-verification.md) mantiene abierto ese
pendiente hasta completar y revisar las fichas correspondientes.
