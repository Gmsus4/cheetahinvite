# Almacenamiento y limpieza de imágenes

## Configuración

1. Aplicar `npx prisma migrate deploy` y generar el cliente con `npx prisma generate`.
2. Mantener las cuatro variables `CLOUDINARY_*` del ejemplo en el servidor.
3. Usar un preset **firmado**, sin cargas unsigned para esta aplicación, con `allowed_formats` limitado a JPG, PNG, WebP y AVIF. No configurar add-ons costosos o transformaciones eager en ese preset. Los presets de Cloudinary no admiten un límite de bytes propio: el máximo de 5 MB se comprueba en el navegador, se impone para imágenes mediante una regla `eval` firmada y se vuelve a comprobar en el servidor consultando el archivo real antes de aceptarlo. Se verifica la configuración del preset antes de entregar firmas, con una caché de cinco minutos; la API key debe poder consultar presets y recursos en la Admin API.
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

- Archivo aceptado: 5 MB por imagen. El archivo viaja directamente del navegador a Cloudinary; las rutas de la aplicación solo aceptan JSON de hasta 4 KB, limitado sobre el flujo real aunque falte `Content-Length`. Un archivo que exceda el límite real nunca se acepta para guardarlo en la invitación, aunque el navegador declare un tamaño falso.
- Cuenta: 20 intentos de carga por hora y 60 por día, en ventanas fijas UTC. Los intentos aceptados para enviar a Cloudinary cuentan aunque falle el proveedor. Borrar eventos o recargar la página no reinicia estos contadores.
- Invitación: 40 archivos y 100 MB. Incluye temporales, reservas y archivos con borrado pendiente. Se reservan 5 MB antes de enviar cada archivo y se reemplaza esa cifra por los bytes confirmados por Cloudinary.
- Cuenta: hasta 120 archivos y 300 MB, derivados de los tres espacios de invitación. La deuda de limpieza de eventos eliminados también cuenta: eliminar y recrear un evento no permite acumular archivos si Cloudinary falla al borrarlos.
- Galería: 12 imágenes por sección, validadas al guardar. El servidor no confía en contadores de fotos enviados por el navegador.

Las reservas, los guardados y las eliminaciones toman un bloqueo PostgreSQL de la cuenta dentro de una transacción. Esto evita sobrepasar cupos mediante solicitudes simultáneas, pestañas o instancias distintas. Las llamadas al proveedor ocurren fuera de las transacciones.

## Ciclo de vida

- Antes de subir se registra un `publicId` UUID en el espacio de la cuenta y el evento. Solo se acepta la respuesta que confirma ese ID, tipo de recurso, URL y tamaño.
- Una imagen confirmada y todavía sin guardar es temporal durante 24 horas. Las autorizaciones de carga directa reservan espacio durante 70 minutos: una hora de validez de la firma de Cloudinary más diez minutos de margen para cargas en vuelo. Las reservas antiguas sin firma pública mantienen su margen de diez minutos.
- Guardar la invitación confirma las fotos referenciadas, incluso en secciones deshabilitadas. Solo después del guardado se encolan las imágenes previamente guardadas que ya no aparecen. Otras fotos temporales de otra pestaña conservan su margen de 24 horas.
- Eliminar un evento encola sus imágenes en la misma transacción que elimina la fila. El registro de archivos no tiene borrado en cascada: la cola sobrevive al evento.
- La limpieza comprueba referencias en todas las invitaciones antes de destruir un archivo, también para enlaces compartidos antiguos. Se usa `destroy` firmado con invalidación de CDN, nunca borrado por prefijo. El proveedor puede tardar en invalidar copias cacheadas.
- Solo una ejecución reclama cada archivo. Los fallos conservan su registro y cupo con reintentos espaciados; no se considera liberado hasta confirmar `ok` o `not found`.
- Incluso al quitar una imagen o eliminar el evento, el borrado de cargas directas espera a que venza el plazo de 70 minutos. Así una firma todavía válida no puede volver a crear un archivo que ya se hubiera limpiado. Los errores de confirmación del proveedor conservan la reserva para permitir reintentos; una respuesta inválida queda en cola de borrado y los bytes conocidos se contabilizan hasta completar la limpieza.
- Cloudinary excluye `resource_type` de la firma y no ejecuta la regla de imágenes para cargas raw. Al vencer la autorización también se eliminan posibles variantes raw/video del mismo ID reservado, conservando la imagen guardada o todavía temporal. El borrado definitivo de un registro limpia los tres tipos del ID exacto, sin barridos por prefijo.
- Si una pestaña intenta volver a guardar una imagen ya retirada, se rechaza el guardado antes de cambiar el evento. No se resucitan archivos en proceso de eliminación.

## Imágenes anteriores y alcance

Las URLs ya guardadas se incorporan al registro cuando se sube, guarda o elimina ese evento, solo si tienen el dominio configurado y el espacio exacto de cuenta/evento con UUID de esta aplicación. Se les asignan conservadoramente 5 MB por archivo porque antes no se guardaban los bytes. No se reclaman archivos externos o de otras cuentas.

Los archivos históricos que ya estaban huérfanos antes de esta implementación **no pueden descubrirse a partir de la base de datos**. Requieren un inventario separado de Cloudinary y revisión de referencias antes de borrarlos. No se ha ejecutado un barrido masivo. Tampoco se automatiza aquí la eliminación completa de eventos vencidos, cuentas o respaldos; ese proceso sigue pendiente en `legal-commercial.md`.

Estos controles acotan nuevas cargas por cuenta y almacenamiento por evento. No sustituyen límites del proveedor, alertas de uso o protección contra creación masiva de cuentas; no representan un tope monetario global de la cuenta de Cloudinary.

## Verificación

### Carga directa firmada

1. El navegador envía `POST /api/cloudinary/upload` con `eventId`, `size` y `contentType`. Se exige sesión, mismo origen, propiedad del evento y reserva atómica de cupo. La respuesta contiene una URL fija de Cloudinary y campos firmados para un único ID aleatorio, con `overwrite=false`; nunca contiene el secreto de API.
2. El navegador envía el `FormData` con el archivo directamente a `https://api.cloudinary.com/.../image/upload`. Los campos firmados incluyen una regla `eval` constante que rechaza imágenes mayores de 5 MB o sin dimensiones válidas; el navegador no puede modificarla ni quitarla sin invalidar la firma. No se acepta multipart ni base64 en las rutas de la aplicación.
3. Envía `PUT /api/cloudinary/upload` con el ID reservado, la versión y la firma de respuesta de Cloudinary. El servidor verifica esa firma y consulta el recurso por su ID en la Admin API. Valida ID, versión, tipo, formato, tamaño real y URL del espacio de la cuenta/evento. La URL de entrega se construye a partir de esa respuesta verificada, nunca de una URL declarada por el navegador.
4. Solo entonces el editor recibe la URL utilizable. La confirmación es idempotente: un reintento no consume otro cupo ni renueva la vigencia temporal. Las cuentas y eventos anteriores no necesitan migraciones.

El límite de 5 MB corresponde a las imágenes que Cloudinary y la aplicación aceptan mediante este flujo. Los límites generales de la cuenta de Cloudinary siguen aplicando; un cliente manipulado puede intentar cargas contra otros tipos de recurso con el mismo ID, que se rechazan al confirmar y se limpian al vencer la firma. Las verificaciones y la limpieza no sustituyen la protección contra abuso ni las alertas de consumo del proveedor.

`node --test tests/*.test.cjs` prueba cupos, concurrencia, permisos, reservas fallidas, reemplazos, borrado de eventos, referencias compartidas y reintentos sin peticiones reales a Cloudinary. En un entorno de pruebas conectado al proveedor, comprobar además una carga real, su reemplazo y la eliminación tras guardar; revisar que una foto todavía usada permanece accesible.

La integración opcional `node tests/cloudinary-storage.postgres.cjs` usa PostgreSQL real para comprobar los bloqueos y las consultas de referencias. Crea una cuenta de prueba con ID aleatorio y la retira al terminar; Cloudinary permanece simulado. Requiere la migración aplicada y conectividad a la base configurada.

Referencias oficiales: [Upload API](https://cloudinary.com/documentation/image_upload_api_reference), [firmas](https://cloudinary.com/documentation/authentication_signatures), [validación con eval](https://cloudinary.com/documentation/upload_parameters#eval_modify_upload_options_before_upload), [eliminación](https://cloudinary.com/documentation/delete_assets).

Prueba opcional con PostgreSQL y Cloudinary reales: `node tests/cloudinary-direct.integration.cjs`. Crea una cuenta y evento desechables, genera una imagen sintética de más de 4.5 MB y menos de 5 MB, verifica el flujo directo y el rechazo de un archivo real mayor al límite y elimina únicamente sus propios archivos y registros al terminar. No utiliza fotografías personales. Requiere conectividad y las credenciales del entorno local.
