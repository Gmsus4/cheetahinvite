# Confirmación de asistencia con enlace general

En el editor, agrega o activa la sección **Confirmación** y elige **En esta
invitación · Sí / No y acompañantes**. Desactiva la sección para ocultarla y
cerrar la recepción de respuestas; las ya recibidas siguen visibles para el
organizador. La opción de enlace externo o WhatsApp se conserva. Las secciones
anteriores sin modo explícito siguen usando su enlace externo.

Para confirmar por WhatsApp, ingresa el teléfono con clave de país y un mensaje
opcional de hasta 200 caracteres. El editor genera el enlace automáticamente;
la clave se muestra separada, con +52 por defecto, y el campo del número acepta
solo dígitos. Para México se requieren 10 dígitos para generar el enlace;
el invitado verá el mensaje listo para enviar. Los enlaces anteriores de
`wa.me` y de `api.whatsapp.com/send` se muestran como teléfono y mensaje al
editarlos. También puedes elegir **Otro enlace de confirmación**. Un teléfono
incompleto se conserva en el borrador, sin generar un botón de WhatsApp.

En **paso 5 → Confirmación de asistencia**, al elegir respuestas integradas,
el organizador configura **Acompañantes permitidos por invitado**, de 0 a 10.
El número cuenta únicamente personas adicionales a quien responde. Los eventos
nuevos comienzan en 0; los anteriores sin configuración conservan el máximo de 5.
La opción se guarda junto al contenido y está disponible también en `/show`.

El formulario pide nombre y apellido, permite elegir Sí asistiré / No asistiré y
ofrece Acompañantes según el límite del evento. Con 0 informa que la invitación
es individual. El servidor verifica el límite dentro de la transacción del evento,
también para las actualizaciones y solicitudes manipuladas.
Una respuesta negativa siempre tiene cero acompañantes y cero asistentes.

Reducir el límite no modifica las respuestas recibidas. Si alguien con una respuesta
anterior que supera el nuevo máximo vuelve a editarla, verá el aviso y deberá ajustar
el número antes de guardar. La lista y el CSV conservan los totales registrados.

Aplicar `npx prisma migrate deploy` en cada entorno al desplegar: la migración
`20261110000000_rsvp_companion_limit` amplía la restricción de PostgreSQL a 10.

Solo se reciben respuestas si la invitación está publicada, pagada, vigente y
con la confirmación integrada activa. Los ejemplos y vistas previas no envían
respuestas reales. La lista y el CSV están disponibles únicamente para la cuenta
propietaria en `/dashboard/eventos/[id]/asistencias`.

El propietario puede eliminar cada respuesta con confirmación desde la lista.
Se elimina de forma permanente y deja de contar en los totales y futuras
descargas de CSV; los archivos ya descargados no cambian. La eliminación no
bloquea al visitante: puede volver a responder mientras el formulario esté activo.

## Identificación y privacidad

Es un enlace general: los nombres son declarados, no identidades verificadas.
No hay lista previa de invitados ni conteo de pendientes, pases QR o control de
entrada. No se solicitan teléfonos, correos ni nombres de acompañantes.

El navegador conserva una clave privada aleatoria de 256 bits en almacenamiento
local, separada por evento. La base guarda solo su hash y la respuesta. Con esa
clave el invitado consulta o actualiza únicamente su propio registro; los reintentos
reutilizan la clave incluso si se pierde la respuesta HTTP. El nombre no se usa
como clave: dos personas pueden llamarse igual. Si se borra el almacenamiento,
se cambia de navegador o está bloqueado, pueden existir registros duplicados.
No se promete identificar a una misma persona entre dispositivos.

Las respuestas y límites se eliminan en cascada al eliminar la invitación.
Desactivar la confirmación conserva las respuestas para el organizador. Se aplica
la política de conservación del contenido del evento, cuyo proceso general de
purga de eventos vencidos sigue pendiente (ver `legal-commercial.md`).

## Controles del servicio

El servidor valida el máximo de cinco acompañantes, los tipos y longitudes de
datos, el estado de publicación y el modo guardado. PostgreSQL añade un CHECK
para impedir valores inválidos. El registro y sus presupuestos se serializan
con bloqueo de fila del evento, incluso ante ediciones o eliminación simultáneas.

Los límites internos iniciales son 500 envíos por evento y hora, 20 actualizaciones
por clave y hora y 10 000 registros por evento. Las ventanas vencidas se eliminan
al recibir nuevos envíos del evento. Los errores de límite no dejan escrituras
parciales. No se almacena IP. El formulario incorpora un campo señuelo, validación
de origen y un máximo real de 2 KiB por solicitud; no sustituye una verificación
de identidad ni impide todo el spam en un enlace público.

Las respuestas privadas usan `no-store`; no hay una API pública para enumerar
invitados. El CSV exige autenticación y propiedad, omite claves y neutraliza
fórmulas de hojas de cálculo en los nombres.

## Verificación

```sh
node --test tests/rsvp.test.cjs
node tests/rsvp.postgres.cjs
```

La segunda prueba usa fixtures propios en PostgreSQL y los elimina al terminar.
