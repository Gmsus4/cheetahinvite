# Textos comerciales y legales

Revisión editorial: 25 de octubre de 2026. Son borradores que deben completarse
con los datos reales del operador y revisarse para la operación concreta.

## Decisiones confirmadas

- Hasta tres invitaciones por cuenta, incluidos borradores.
- Crear y previsualizar gratis; pagar por la publicación de cada evento.
- Precio confirmado: $269 MXN por evento, IVA incluido.
- Enlace público que puede reenviarse; sin contraseña ni control de asistentes.
- Publicación de doce meses desde confirmar el pago, sin renovación automática.
- Confirmaciones integradas pendientes; solo se ofrecen enlaces externos.
- Soporte: cheetahinvite@gmail.com. La ayuda y recuperación manual preparan
  un correo que el usuario debe enviar; no crean tickets automáticamente.
- Reembolsos comerciales por fallas propias que impidan prestar el servicio,
  incluidos cobros duplicados por error del sistema. No excluir derechos legales.
- Contenido vencido: tres meses naturales de conservación después del vencimiento.
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

## Operación de conservación: pendiente de implementar

El vencimiento deshabilita el enlace mediante la comprobación de vigencia.
El proyecto no incluye aún una tarea automática que elimine eventos vencidos
o sus respaldos. La limpieza de imágenes reemplazadas, eliminadas y temporales
está implementada con cola persistente; requiere el scheduler descrito en
`cloudinary-storage.md` y no sustituye la eliminación de eventos vencidos.

Para cumplir la política de tres meses, el equipo debe establecer y ejecutar
un procedimiento de revisión y eliminación, manual o automatizado, que:

- Identifique eventos que cumplieron tres meses naturales desde `expiresAt`.
- Registre solicitudes de cierre y su fecha límite.
- Separe los datos del evento de los registros de compras que deban conservarse.
- Retire archivos de Cloudinary y resuelva el ciclo de respaldos según los plazos
  y contratos acordados, sin asumir que borrar una fila elimina todas las copias.
- Actualice el contador de espacios y registre la ejecución sin datos innecesarios.

El texto describe la política elegida; no significa que se haya implementado esa
automatización. No se ha ejecutado ninguna eliminación ni programado tareas.

## Referencias oficiales consultadas

- Ley Federal de Protección de Datos Personales en Posesión de los Particulares:
  https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf
- Ley Federal de Protección al Consumidor:
  https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf

Confirmar los requisitos aplicables de información, privacidad, cancelación y
atención al consumidor con asesoría legal antes de dar por definitivos los textos.
