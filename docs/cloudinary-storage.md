# Almacenamiento y limpieza de imágenes

## Configuración

1. Aplicar `npx prisma migrate deploy` y generar el cliente con `npx prisma generate`.
2. Mantener las cuatro variables `CLOUDINARY_*` del ejemplo en el servidor.
3. Usar un preset **firmado**, sin cargas unsigned para esta aplicación, con formatos JPG, PNG, WebP y AVIF y máximo 5 MB. No configurar add-ons costosos o transformaciones eager en ese preset.
4. Crear un `CRON_SECRET` aleatorio, privado y de al menos 32 bytes.
5. Programar cada cinco minutos una petición GET a `/api/internal/cloudinary/cleanup` con `Authorization: Bearer <CRON_SECRET>`. El alojamiento no está elegido en este repositorio: este endpoint no programa una tarea por sí solo. Un 503 significa que falta el secreto; un 401, autorización incorrecta. Ante 500, reintentar y revisar los registros. La respuesta da conteos `deleted`, `retained` y `failed`; los fallos individuales quedan en cola y pueden devolver 200 con `failed > 0`.

No llamar ese endpoint desde el navegador ni exponer el secreto mediante `NEXT_PUBLIC_`. `after` hace un intento adicional tras subir, guardar o eliminar, pero la tarea periódica es necesaria para limpiar cargas abandonadas y recuperar fallos sin actividad de usuarios. Cada ejecución procesa hasta cinco candidatos, con tiempo máximo de 60 segundos; aumentar la frecuencia si crece la cola.

### Cloudflare

Se incluye un Worker separado en `workers/cloudinary-cleanup/`, con Cron Trigger cada cinco minutos, sin URL pública y con registro de ejecuciones. No cambia el framework ni configura el despliegue de la aplicación Next.js.

Cuando exista un dominio de producción:

1. Establecer `vars.APP_ORIGIN` en `workers/cloudinary-cleanup/wrangler.jsonc` con el origen HTTPS de la aplicación, sin rutas.
2. Configurar `CRON_SECRET` en el servidor de la aplicación y el mismo valor como secreto del Worker. No es ninguna clave de Cloudinary; el Worker solo llama al endpoint autenticado.
3. Desde la raíz, autenticarse en Cloudflare y configurar el secreto: `npx wrangler secret put CRON_SECRET --config workers/cloudinary-cleanup/wrangler.jsonc`. Ese comando modifica recursos remotos y solo debe ejecutarse cuando se haya decidido el despliegue.
4. Desplegar: `npx wrangler deploy --config workers/cloudinary-cleanup/wrangler.jsonc`.
5. Comprobar las ejecuciones programadas y revisar sus fallos en Cloudflare. Una respuesta con borrados fallidos marca la ejecución como fallida; la cola se conserva para el siguiente intento. El Worker rechaza redirecciones para no enviar la autorización a otro destino.

El Worker está preparado, **no desplegado**. Los secretos de producción, el dominio y la adaptación del servidor Next.js a Cloudflare se configuran en ese despliegue. Documentación oficial: [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), [secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

## Límites iniciales

Se ajustan en `lib/limits.ts`:

- Archivo y cuerpo multipart: 5 MB por imagen, con 128 KB adicionales para el formulario. Se limita el flujo real aunque falte `Content-Length`.
- Cuenta: 20 intentos de carga por hora y 60 por día, en ventanas fijas UTC. Los intentos aceptados para enviar a Cloudinary cuentan aunque falle el proveedor. Borrar eventos o recargar la página no reinicia estos contadores.
- Invitación: 40 archivos y 100 MB. Incluye temporales, reservas y archivos con borrado pendiente. Se reservan 5 MB antes de enviar cada archivo y se reemplaza esa cifra por los bytes confirmados por Cloudinary.
- Cuenta: hasta 120 archivos y 300 MB, derivados de los tres espacios de invitación. La deuda de limpieza de eventos eliminados también cuenta: eliminar y recrear un evento no permite acumular archivos si Cloudinary falla al borrarlos.
- Galería: 12 imágenes por sección, validadas al guardar. El servidor no confía en contadores de fotos enviados por el navegador.

Las reservas, los guardados y las eliminaciones toman un bloqueo PostgreSQL de la cuenta dentro de una transacción. Esto evita sobrepasar cupos mediante solicitudes simultáneas, pestañas o instancias distintas. Las llamadas al proveedor ocurren fuera de las transacciones.

## Ciclo de vida

- Antes de subir se registra un `publicId` UUID en el espacio de la cuenta y el evento. Solo se acepta la respuesta que confirma ese ID, tipo de recurso, URL y tamaño.
- Una imagen subida y todavía sin guardar es temporal durante 24 horas. Una carga interrumpida conserva su reserva durante diez minutos antes de intentar borrarla, para contemplar respuestas perdidas o subidas aún en vuelo.
- Guardar la invitación confirma las fotos referenciadas, incluso en secciones deshabilitadas. Solo después del guardado se encolan las imágenes previamente guardadas que ya no aparecen. Otras fotos temporales de otra pestaña conservan su margen de 24 horas.
- Eliminar un evento encola sus imágenes en la misma transacción que elimina la fila. El registro de archivos no tiene borrado en cascada: la cola sobrevive al evento.
- La limpieza comprueba referencias en todas las invitaciones antes de destruir un archivo, también para enlaces compartidos antiguos. Se usa `destroy` firmado con invalidación de CDN, nunca borrado por prefijo. El proveedor puede tardar en invalidar copias cacheadas.
- Solo una ejecución reclama cada archivo. Los fallos conservan su registro y cupo con reintentos espaciados; no se considera liberado hasta confirmar `ok` o `not found`.
- Si una pestaña intenta volver a guardar una imagen ya retirada, se rechaza el guardado antes de cambiar el evento. No se resucitan archivos en proceso de eliminación.

## Imágenes anteriores y alcance

Las URLs ya guardadas se incorporan al registro cuando se sube, guarda o elimina ese evento, solo si tienen el dominio configurado y el espacio exacto de cuenta/evento con UUID de esta aplicación. Se les asignan conservadoramente 5 MB por archivo porque antes no se guardaban los bytes. No se reclaman archivos externos o de otras cuentas.

Los archivos históricos que ya estaban huérfanos antes de esta implementación **no pueden descubrirse a partir de la base de datos**. Requieren un inventario separado de Cloudinary y revisión de referencias antes de borrarlos. No se ha ejecutado un barrido masivo. Tampoco se automatiza aquí la eliminación completa de eventos vencidos, cuentas o respaldos; ese proceso sigue pendiente en `legal-commercial.md`.

Estos controles acotan nuevas cargas por cuenta y almacenamiento por evento. No sustituyen límites del proveedor, alertas de uso o protección contra creación masiva de cuentas; no representan un tope monetario global de la cuenta de Cloudinary.

## Verificación

`node --test tests/*.test.cjs` prueba cupos, concurrencia, permisos, reservas fallidas, reemplazos, borrado de eventos, referencias compartidas y reintentos sin peticiones reales a Cloudinary. En un entorno de pruebas conectado al proveedor, comprobar además una carga real, su reemplazo y la eliminación tras guardar; revisar que una foto todavía usada permanece accesible.

La integración opcional `node tests/cloudinary-storage.postgres.cjs` usa PostgreSQL real para comprobar los bloqueos y las consultas de referencias. Crea una cuenta de prueba con ID aleatorio y la retira al terminar; Cloudinary permanece simulado. Requiere la migración aplicada y conectividad a la base configurada.

Referencias oficiales: [Upload API](https://cloudinary.com/documentation/image_upload_api_reference), [eliminación](https://cloudinary.com/documentation/delete_assets).
