# Capturas de la galería de demos

`/demo` muestra imágenes WebP dentro de los celulares; no monta iframes ni ejecuta las invitaciones. El hero conserva su preview interactiva.

## Publicar desde el admin

«Publicar ejemplo» y «Publicar cambios» generan automáticamente una captura del borrador guardado, con sus fotos, textos, tipografías y estilos, antes de publicar. El botón indica «Generando imagen y publicando…». La captura y el contenido se guardan juntos en una transacción.

Si la captura falla o alguien modifica el borrador mientras se genera, se muestra un error y se conserva la publicación anterior. Se puede reintentar con el mismo botón. El navegador de captura se cierra también si hay errores y nunca se mantiene una transacción de base de datos abierta mientras trabaja.

La ruta de renderizado requiere una firma HMAC de corta duración vinculada al ID y a la versión del borrador; las visitas públicas no pueden consultar borradores. El navegador espera las fuentes y las imágenes visibles antes de tomar una captura de 390 × 830 en WebP.

La captura se almacena dentro del JSON de publicación en PostgreSQL. La ruta de imágenes solo sirve capturas de ejemplos publicados y usa una URL distinta por contenido de imagen, con caché inmutable. No se escriben archivos en producción, no se necesita migración y las capturas no se envían como base64 al cliente ni al hero. `/demo` se invalida al publicar.

## Servidor

- `APP_URL` debe apuntar al sitio accesible desde el servidor. `AUTH_SECRET` firma los enlaces temporales.
- Linux usa `@sparticuz/chromium`. El empaquetado de Next incluye sus binarios para las rutas de admin. El hosting debe permitir procesos Chromium y suficiente tiempo/memoria para capturar; reservar al menos 60 segundos para la publicación.
- En Windows se detectan Chrome, Brave o Edge; en macOS se detecta Chrome. `CHROMIUM_EXECUTABLE_PATH` permite indicar otro binario instalado.
- El navegador solo carga recursos del propio sitio y de Cloudinary. No se transmite el token de renderizado como referente a otros dominios.

La comprobación opcional `node tests/demo-capture.integration.cjs` usa la app en ejecución y su base de datos configurada para capturar un borrador existente. Valida el WebP y lo guarda en el directorio temporal del sistema; no publica ni modifica registros.

## Capturas iniciales

Las capturas locales de `public/demo-preview/` siguen funcionando para las publicaciones existentes. Al volver a publicar desde el admin se reemplazan automáticamente por la captura guardada en PostgreSQL. No se necesita ejecutar un comando ni desplegar de nuevo.

`npm run images:demo` queda como herramienta opcional para optimizar las capturas iniciales: lee `.next/demo-captures/manifest.json` con objetos `{ "slug": "...", "key": "..." }` y JPEG de 390 × 830 llamados `<key>.jpg`, genera WebP y actualiza `lib/demo-preview-images.ts`. Si cambia el CSS global, volver a publicar los ejemplos renueva sus capturas.
