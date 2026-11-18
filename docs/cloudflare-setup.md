# Cloudflare: de la cuenta al dominio

Guía para este proyecto. Primero se publica un entorno de pruebas (`staging`)
en `workers.dev`; después se prepara producción y se conecta el dominio elegido.
La integración local de R2 ya existe. Los recursos remotos deben comprobarse
en la cuenta: tener los bindings escritos no significa que estén creados.

## Estado verificado — 18 de noviembre de 2026

- Wrangler autorizado y cuenta del despliegue fijada en `wrangler.jsonc`.
- Creados `cheetahinvite-images-staging` y `cheetahinvite-cache-staging`, ambos
  con almacenamiento Standard. Acceso `r2.dev` desactivado y sin dominios públicos.
- El propietario eligió probar exclusivamente con los niveles gratuitos.
  Workers Free sigue activo; no se contrató Workers Paid, Images Paid ni dominio.
- Creado el Worker `cheetahinvite-staging` con doce secretos autorizados
  explícitamente: base de pruebas, secretos nuevos de sesión/cron, Google OAuth,
  Stripe test, PayPal sandbox y Mercado Pago de vendedor de pruebas confirmado.
  Resend queda sin configurar: el propietario aún no tiene cuenta.
- URL configurada: `https://cheetahinvite-staging.fergomez-js.workers.dev`.
  Retirado el presupuesto de CPU de Paid para utilizar el límite del plan Free.
- El propietario confirmó que la conexión PostgreSQL local corresponde a una base
  exclusiva de pruebas; puede utilizarse para staging.
- Base accesible y sin migraciones pendientes. No se modificó su esquema ni el DNS.
- Pasaron 14 pruebas locales de R2, cron y aislamiento del cliente PostgreSQL.
- Compilación Next/OpenNext y TypeScript correctos. Bundle de 17.680,67 KiB
  sin comprimir, dentro del límite de 64 MiB de Workers Free.
- Publicado y verificado en Workers Free: portada, registro con contraseña,
  sesión, panel, guardado del editor, R2/Images, captura Browser Run y limpieza.
- Google devuelve `redirect_uri_mismatch`: falta registrar el callback de staging
  en la cuenta que administra el cliente OAuth. El propietario decidió aplazarlo.
- Verificadas firmas Stripe válidas/falsas con un evento sintético ignorado.
  Pendientes pagos sandbox completos y registro de webhooks específicos de staging.
- Prueba de administración autorizada: captura WebP de 390 × 830, ejemplo retirado
  a borrador y cuenta sintética restaurada a USER. Ninguna otra cuenta fue elevada.

Workers Free admite 100.000 solicitudes diarias y 10 ms de CPU por solicitud.
La aceptación de staging requiere verificar CPU y errores reales de registro,
login, renderizado y cron. La espera
de red o de PostgreSQL no cuenta como CPU. El cálculo de contraseñas con scrypt sí
requiere especial atención. No reducir su seguridad para cumplir el presupuesto.
Consultar los [límites oficiales](https://developers.cloudflare.com/workers/platform/limits/).

### Condición de costo para estas pruebas

No activar mejoras de plan ni comprar un dominio. Usar `workers.dev`, pagos sandbox
y el PostgreSQL de pruebas existente. Images Free limita las transformaciones a
5.000 mensuales; Browser Run Free tiene diez minutos diarios. Las pruebas remotas
deben ser pequeñas y acotadas, sin cargas masivas ni pruebas de estrés.

R2 ya está activado con facturación por uso. Su franquicia Standard incluye
10 GB-mes de almacenamiento, un millón de operaciones A y diez millones B al mes,
compartidos por la cuenta. Estos recursos no tienen un bloqueo monetario nativo:
no se puede prometer una factura máxima de cero si se excede la franquicia o hay
tráfico abusivo. Mantener buckets privados y monitorizar consumo; no tratar una
alerta de presupuesto como un corte de gasto.

## 1. Iniciar sesión y conectar la terminal

1. Entrar a [Cloudflare](https://dash.cloudflare.com/login) con la cuenta existente.
2. Completar la verificación de acceso si aparece.
3. Abrir una terminal en la carpeta del proyecto y ejecutar:

   ```powershell
   npx wrangler login
   ```

4. En el navegador, revisar la solicitud de Wrangler y autorizarla.
5. Esperar la confirmación en la terminal y comprobar la cuenta:

   ```powershell
   npx wrangler whoami
   ```

Estar conectado en el panel y estar conectado en Wrangler son sesiones distintas.
Si falla el retorno a `localhost:8976`, terminar el comando anterior con Ctrl+C
y usar `npx wrangler login --device`. No compartir tokens, contraseñas ni códigos
de autorización en el chat. Si hay varias cuentas, seleccionar la correcta y
fijar su `account_id` en la configuración antes de crear recursos o desplegar.

## 2. Activar los servicios necesarios

| Servicio | Uso en el proyecto | Preparación |
| --- | --- | --- |
| Workers Free o Paid | Next.js, autenticación y APIs | Evaluar Free; Paid ofrece más margen de CPU si las mediciones lo requieren |
| R2 | Imágenes y caché incremental | Activar R2 y crear dos buckets privados |
| Images | Inspección y conversión de fotos a WebP | Comprobar acceso a transformaciones mediante el binding `IMAGES` |
| Browser Run | Capturas de ejemplos | Comprobar disponibilidad del binding `BROWSER` |
| Durable Objects | Cola y etiquetas de caché | Wrangler los configura mediante las migraciones declaradas |
| Cron Triggers | Limpieza de imágenes e invitaciones | Declarado cada cinco minutos en `wrangler.jsonc` |

Workers Paid y el plan de una zona/dominio son suscripciones distintas. Este
proyecto no exige contratar el plan Pro de una zona para desplegar el Worker.
Workers Paid parte de US$5/mes; el total depende del consumo y otros servicios.
R2 requiere activar su suscripción aunque tenga uso gratuito incluido. Revisar
el precio mostrado antes de confirmar cualquier contratación.

Las fotos se guardan en R2. Images se utiliza para transformarlas; esta arquitectura
no requiere almacenar otra copia en el servicio de almacenamiento de Images.

Precios: [Workers](https://developers.cloudflare.com/workers/platform/pricing/),
[R2](https://developers.cloudflare.com/r2/pricing/),
[Images](https://developers.cloudflare.com/images/pricing/) y
[Browser Run](https://developers.cloudflare.com/browser-run/pricing/).

## 3. Crear los buckets de pruebas

En **Storage & databases → R2 → Overview**, activar R2 si falta. Crear:

| Nombre exacto | Binding existente |
| --- | --- |
| `cheetahinvite-images-staging` | `INVITATION_IMAGES` |
| `cheetahinvite-cache-staging` | `NEXT_INC_CACHE_R2_BUCKET` |

Elegir almacenamiento Standard y mantener ambos privados. La aplicación recibe
las cargas autenticadas, procesa las imágenes y las entrega por `/api/media/...`;
no necesita habilitar `r2.dev`, dominio público del bucket, CORS ni claves S3.
No agregar una regla general de expiración al bucket de imágenes: la limpieza
comprueba las referencias guardadas en PostgreSQL antes de borrar objetos.

## 4. Preparar PostgreSQL y los secretos

Esta aplicación usa PostgreSQL y Prisma. R2 guarda archivos; no sustituye la base
de datos. Crear una base o rama de pruebas separada con conexión TLS accesible
desde Workers. No hace falta migrar a D1 para este despliegue.

Preparar estos secretos para el Worker de pruebas:

- `DATABASE_URL`: conexión de la base de pruebas.
- `AUTH_SECRET`: secreto aleatorio nuevo para las sesiones.
- `CRON_SECRET`: otro secreto aleatorio para la limpieza.
- `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET`: para el acceso con Google.
- `RESEND_API_KEY`: para enviar correos de recuperación; configurar también
  `RESEND_FROM_EMAIL` con un remitente verificado.
- Credenciales y firmas de los proveedores de pago que se habiliten, inicialmente
  en modo de pruebas. Consultar [pagos](payment-methods.md) y [Stripe](stripe.md).

`DIRECT_URL` se necesita en el equipo o proceso que ejecuta las migraciones de
Prisma; no es necesaria como secreto del Worker. Ejecutar `npx prisma migrate deploy`
solo después de comprobar que `DIRECT_URL` apunta a la base de staging. Las
migraciones no se ejecutan automáticamente durante una petición ni durante el build.

Los secretos remotos se cargan con `wrangler secret put` o, cuando exista el Worker,
en **Workers & Pages → cheetahinvite-staging → Settings → Variables and Secrets**.
No se suben automáticamente desde `.env` o `.dev.vars`. No poner secretos en Git
ni en `wrangler.jsonc`.

El script `npm run build:workers` también filtra el módulo de entorno generado por
OpenNext para conservar únicamente variables `NEXT_PUBLIC_` y retira las copias
`.env*` de las funciones generadas. Los demás valores proceden de bindings,
variables y secretos remotos. `npm run check:workers` rechaza un artefacto que
todavía contenga variables privadas locales. No usar el comando de build del
adaptador directamente para preparar un despliegue de este proyecto.

## 5. Configurar y desplegar staging

Antes del primer despliegue:

1. Elegir o consultar el subdominio `workers.dev` de la cuenta.
2. Obtener la dirección del Worker `cheetahinvite-staging` en ese subdominio.
3. En `wrangler.jsonc`, cambiar `APP_ENV` a `staging` y fijar `APP_URL` y `AUTH_URL`
   a esa dirección pública HTTPS. Conservar `AUTH_TRUST_HOST=true` y los pagos
   en sandbox. Actualmente el archivo contiene valores de desarrollo local.
4. Comprobar buckets, bindings, secretos y migraciones SQL de staging.
5. Compilar y comprobar el bundle:

   ```powershell
   npm run build:workers
   npm run typecheck
   npm run check:workers
   ```

6. Publicar mediante el adaptador OpenNext, que también prepara su caché:

   ```powershell
   npx opennextjs-cloudflare deploy
   ```

`check:workers` hace un dry-run local; no publica. Las opciones `remote: false`
controlan el uso de bindings durante desarrollo local, no impiden que el Worker
desplegado use los recursos reales. No cambiar esas opciones para publicar.

Registrar en Google el callback exacto
`https://HOST-DE-STAGING/api/auth/callback/google`. Registrar endpoints de webhook
de pruebas para cada proveedor habilitado, sin reemplazar los de producción.

## 6. Verificar la aplicación publicada

- Registro, entrada con contraseña y Google, cierre de sesión y recuperación.
- Crear una invitación, subir una foto real y comprobarla después de recargar.
- Ver en R2 que el objeto se creó y que la aplicación lo entrega como WebP.
- Guardar y publicar la invitación; comprobar RSVP y capturas de ejemplos.
- Completar pagos sandbox y comprobar que los webhooks actualizan el estado.
- Comprobar las ejecuciones del cron y los errores/consumos en el panel.

La cobertura local y las comprobaciones remotas pendientes están en
[verificación de la migración](cloudflare-verification.md). Una compilación
correcta no demuestra por sí sola que OAuth, imágenes o pagos remotos funcionen.

## 7. Preparar producción y conectar el dominio

1. Elegir y comprar el dominio. Puede estar registrado en Cloudflare o en otro
   registrador. Antes de comprar, revisar disponibilidad, precio y renovación.
2. Añadirlo a Cloudflare si está registrado fuera. Revisar los registros DNS
   existentes, incluidos los de correo, antes de cambiar los nameservers.
3. Preparar un Worker, buckets, base y secretos propios de producción. Cambiar
   también el service binding de autorreferencia al nombre del Worker de producción.
4. Cuando la zona esté activa, abrir el Worker de producción → **Settings →
   Domains & Routes → Add → Custom Domain** y agregar el dominio elegido.
   Cloudflare configura el DNS y el certificado del Custom Domain. Revisar antes
   cualquier registro que ya atienda ese hostname para evitar interrumpir otro sitio.
5. Definir una dirección canónica, actualizar `APP_URL`, `AUTH_URL` y
   `APP_ENV=production`, y desplegar con esa configuración.
6. Actualizar callbacks de Google, URLs de webhook y DNS del remitente de correo.
   Verificar pagos y acceso antes de dar por finalizado el lanzamiento.

Elegir la URL definitiva antes de cargar contenido real: las URLs de imágenes
actuales incluyen el origen de `APP_URL`. Cambiar de host después requiere
mantener el host anterior o migrar y verificar las referencias existentes.

La compra del dominio no incluye una bandeja de correo. El envío transaccional
del proyecto se configura por separado con Resend.

Referencias oficiales: [inicio de sesión de Wrangler](https://developers.cloudflare.com/workers/wrangler/commands/general/#login),
[activación de R2](https://developers.cloudflare.com/r2/get-started/),
[dominios del Worker](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) y
[configuración de nameservers](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/).
