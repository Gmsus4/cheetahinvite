# Textos comerciales y legales

Revisión editorial: 25 de octubre de 2026. Son borradores que deben completarse
con los datos reales del operador y revisarse para la operación concreta.

## Decisiones confirmadas

- Hasta tres invitaciones por cuenta, incluidos borradores.
- Crear y previsualizar gratis; pagar por la publicación de cada evento.
- Precio confirmado: $269 MXN por evento, IVA incluido.
- Enlace público que puede reenviarse; sin contraseña ni control de entrada.
- Publicación de doce meses desde confirmar el pago, sin renovación automática.
- Confirmaciones integradas opcionales: nombre, Sí/No y hasta cinco acompañantes
  extra, con consulta privada y CSV para el organizador. También se mantienen
  enlaces externos. Los nombres no son identidades verificadas; ver `rsvp.md`.
- Soporte: cheetahinvite@gmail.com. La ayuda y recuperación manual preparan
  un correo que el usuario debe enviar; no crean tickets automáticamente.
- Reembolsos comerciales por fallas propias que impidan prestar el servicio,
  incluidos cobros duplicados por error del sistema. No excluir derechos legales.
- Contenido vencido: un mes natural de archivo después del vencimiento, con renovación manual y eliminación automática al terminar sin renovar.
- Cierre de cuenta solicitado por soporte: hasta tres meses para tramitar la baja
  del contenido, respetando cancelaciones procedentes y conservación legal.

## Datos pendientes del propietario

1. Nombre completo o razón social y domicilio del responsable/proveedor.
2. Teléfono comercial y responsable de atender privacidad y derechos ARCO.
3. Información fiscal y de facturación que corresponda. El precio confirmado
   se centraliza en `lib/invitation-payment.ts` y se muestra en landing, editor y pago.
4. Alojamiento de producción y verificación de entidades, contratos, regiones
   y flujos de datos de Google/Gmail, Cloudinary, Neon, Stripe y Resend.
5. Plazos de conservación de compras, soporte, registros técnicos y respaldos.
   El historial independiente de pagos ya conserva referencias, importes y estados
   al borrar una invitación; falta definir su periodo de retención antes de ventas.
6. Inventario final de cookies y duraciones en producción; la revisión del código
   no encontró analítica ni publicidad, pero no sustituye la inspección del
   entorno desplegado ni de las pantallas de terceros.

Los marcadores `[POR DEFINIR]` se mantienen únicamente donde faltan datos o
decisiones que no deben inventarse. No se ha declarado que el sitio está listo
para operar legalmente ni que los documentos garantizan cumplimiento.

## Operación de conservación

El vencimiento deshabilita el enlace y la edición al cumplir doce meses. La tarea
periódica autenticada archiva las invitaciones y las elimina después de un mes
natural sin renovación, encolando sus imágenes y liberando el espacio. El historial
de compras se conserva independientemente. Ver `invitation-lifecycle.md` y
`cloudinary-storage.md` para migración, scheduler y comprobaciones. El Worker
incluido requiere configuración y despliegue para ejecutar la limpieza sin visitas.

Siguen pendientes el proceso de cierre de cuentas solicitado por soporte y el
ciclo de eliminación de respaldos y copias de proveedores. Esta implementación
no programa ni ejecuta por sí sola tareas remotas de producción.

## Referencias oficiales consultadas

- Ley Federal de Protección de Datos Personales en Posesión de los Particulares:
  https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf
- Ley Federal de Protección al Consumidor:
  https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf

Confirmar los requisitos aplicables de información, privacidad, cancelación y
atención al consumidor con asesoría legal antes de dar por definitivos los textos.
