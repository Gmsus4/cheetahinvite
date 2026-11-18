# Cloudflare Workers: migración y entorno de pruebas

Esta rama prepara Workers sin desplegar, copiar imágenes ni modificar Vercel,
`master`, la carpeta original o los recursos de producción.

Resultados y limitaciones comprobados: [verificación local](cloudflare-verification.md).

## Compatibilidad y arquitectura

Revisado el 17 de noviembre de 2026: Next.js **16.4.6**, OpenNext **1.20.17**,
Wrangler **4.164.0**, `@cloudflare/puppeteer` **2.0.1**, Prisma **7.10.1**.
OpenNext admite `>=15.5.29 <16 || >=16.4.5`. Se conserva Next, React y el runtime
Node de Next con compatibilidad Node en Workers, sin `next-on-pages` ni Edge Runtime.
La documentación actual de Cloudflare recomienda vinext como vía predeterminada.
Aquí se elige explícitamente OpenNext para conservar la versión instalada de Next
y sus APIs, en lugar de sustituir el framework durante esta migración. La matriz
de compatibilidad relevante es la del adaptador OpenNext fijado y las pruebas locales.

- Se conservan las invalidaciones existentes. **Cache Components y Partial
  Prefetching quedan desactivados**: con Next 16.4.6/OpenNext 1.20.17, el login
  se bloqueó en workerd y Next advirtió sobre su implementación de temporizadores.
  Hero y Pricing pasan a SSR, leyendo precios/ejemplos durante la petición.
  Se pierde la optimización de shells PPR y preservación automática con Activity;
  los borradores del editor mantienen su persistencia explícita. No reactivar
  estas opciones hasta pasar pruebas HTTP concurrentes en workerd y staging.
  La caché incremental estándar usa R2; cola y etiquetas usan Durable Objects.
- PostgreSQL sigue siendo PostgreSQL. Prisma 7 conserva su cliente TypeScript y
  `@prisma/adapter-pg`, generando con `runtime = "workerd"` para importar WASM
  estático (Workers prohíbe compilar WASM dinámicamente). En workerd cada contexto
  de petición obtiene un cliente; `maxUses: 1` cierra sockets al liberarlos.
  En Node (`next dev` incluido) se reutiliza el pool aunque OpenNext proporcione
  un contexto de desarrollo. La conexión admite hasta 15 segundos para permitir
  el arranque de una base suspendida; cambiar su configuración renueva el cliente
  almacenado durante el desarrollo. Se mantienen
  transacciones interactivas y bloqueos de fila/advisory, incluso tras borrar cuentas.
- Stripe usa FetchHttpClient y verificación asíncrona del cuerpo original.
  PayPal/Mercado Pago ya usan fetch. Se conservan firmas, idempotencia y conciliación.
  `APP_ENV=staging` exige HTTPS público para retornos de pago.
- Auth.js mantiene JWT, versión de sesión, roles, PrismaAdapter, Google y scrypt.
  Los límites por IP del PIN utilizan `CF-Connecting-IP` de Cloudflare.
- Las capturas usan `BROWSER`, sin binario Chromium ni disco local en runtime.
  Conservan token, revisión del contenido, viewport, espera de fuentes/imágenes y
  cierre del navegador. Puppeteer local queda solo para herramientas de desarrollo.
- `worker.ts` agrega cron al handler OpenNext. Cada cinco minutos llama al endpoint
  interno por el service binding del propio Worker y `CRON_SECRET`. `after()`
  conserva la limpieza breve tras guardar; el cron reintenta sin visitas.
  Se retiró el Worker que llamaba al endpoint de Vercel.

Fuentes oficiales consultadas:

- [Next.js en Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Versiones y funciones admitidas](https://opennext.js.org/cloudflare)
- [Instalación en proyectos existentes](https://opennext.js.org/cloudflare/get-started)
- [Caché e invalidación](https://opennext.js.org/cloudflare/caching)
- [Worker personalizado y cron](https://opennext.js.org/cloudflare/howtos/custom-worker)
- [Prisma y conexiones por petición](https://opennext.js.org/cloudflare/howtos/db)
- [Generador Prisma 7 para Workers](https://www.prisma.io/docs/guides/v7/deployment/cloudflare-workers)
- [Stripe con fetch](https://opennext.js.org/cloudflare/howtos/stripeAPI)
- [Puppeteer en Browser Run](https://developers.cloudflare.com/browser-run/puppeteer/)
- [Images binding](https://developers.cloudflare.com/images/transform-images/bindings/)
- [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)

También se leyeron las guías locales de despliegue, Route Handlers, paquetes
externos, Cache Components, `io`, `connection` y `after` en `node_modules/next/dist/docs/`.
La guía OpenNext de Prisma muestra un generador antiguo: este proyecto conserva
el generador TypeScript de Prisma 7 y verifica el bundle real por separado.

## Imágenes y conservación de garantías

`POST /api/images/upload` verifica sesión, propietario, estado editable y permisos
administrativos; reserva cupo y devuelve una clave opaca, sin credenciales del bucket.
`PUT` recibe los bytes con sesión/origen verificados y lectura acotada incluso sin
Content-Length. Cloudflare **Images** inspecciona el contenido, rechaza SVG/formatos
ajenos y más de 40 millones de píxeles, y decodifica/recodifica a WebP de hasta
2560 × 2560. El original de entrada sigue limitado a 5 MiB. **R2 no valida imágenes
por sí solo: Images es un binding necesario además del bucket.**

Se conservan cupos por cuenta/evento, bytes, presupuestos por hora/día y temporales
de 24 horas. Las reservas duran diez minutos. Las escrituras R2 son condicionales
para impedir sobrescrituras; los reintentos no duplican reservas ni prolongan leases.
Una operación fallida sigue ocupando cupo hasta confirmar el borrado.

La escritura se serializa con guardados, eliminación del evento y limpieza.
Se comprueban referencias de portada, fondo, galerías, secciones desactivadas y
ejemplos publicados. La limpieza mantiene reclamaciones con lease y reintentos.
`/api/media/...` conserva URLs públicas difíciles de adivinar, como Cloudinary;
solo entrega imágenes verificadas y exige revalidación para respetar bajas. Una
imagen pendiente de limpieza sigue disponible si otra invitación la referencia;
se retira cuando la limpieza confirma el borrado. El bucket es privado.

Se conserva el nombre histórico `CloudinaryAsset` para evitar renombrados o
reescrituras. La migración aditiva agrega `provider`, por defecto `CLOUDINARY`.
Las cargas nuevas escriben `R2` explícitamente. **La limpieza solo selecciona R2**;
no hay código que borre en Cloudinary. Las referencias antiguas siguen legibles y
sus cupos se contabilizan conservadoramente. Su traslado queda para una fase futura.

## Comprobaciones locales

Requiere Node.js 22/24, npm y los binarios de desarrollo instalados por npm.
OpenNext recomienda WSL/Linux; el script fija TEMP dentro del worktree para evitar
rutas de sandbox de Windows con caracteres especiales. CI debería usar Linux.

```powershell
npm ci
npm run build:workers
npm run typecheck
npm run lint
npm test
npm run test:postgres
node scripts/test-postgres.cjs --workers
npm run check:workers
```

`build:workers` no necesita base de datos: las lecturas dinámicas esperan una
petición real. Si faltan variables, el script proporciona una URL local ficticia
solo para generar Prisma. Nunca proporcionar DATABASE_URL de producción al build.
El script usa junctions de directorio para el empaquetador OpenNext en Windows,
sin modificar node_modules ni requerir privilegio para crear enlaces simbólicos.
El tracing incluye explícitamente `pg-cloudflare`, seleccionado por pg solo en Workers.
También excluye WASM ajeno al compilador PostgreSQL y herramientas de desarrollo:
el loader WASM de Turbopack trazaba archivos de CLI no utilizados e hinchaba el
bundle. El compilador PostgreSQL queda en los chunks de servidor de Next; el
script conserva además los dos WASM del renderer OG que el servidor de Next importa.
`check:workers` comprueba el límite actual de 64 MiB sin comprimir; el tamaño gzip
es informativo, no el límite vigente. Ver [límites oficiales](https://developers.cloudflare.com/workers/platform/limits/).

`test:postgres` siempre sustituye DATABASE_URL/DIRECT_URL por una base temporal
en 127.0.0.1, aunque el shell tenga otras credenciales. Ejecuta SQL real y simula
proveedores. `--workers` inicia workerd local con PostgreSQL temporal y R2 local;
comprueba autenticación, peticiones sucesivas, reservas, validación y webhooks.
Los datos temporales quedan en `.cloudflare-test/` (ignorado); PostgreSQL se detiene
al terminar. La suite histórica `invitation-privacy.postgres.cjs` requiere un
servidor HTTP adicional y no se incluye en el runner SQL; el modo Workers cubre HTTP.
`check:workers` usa `wrangler deploy --dry-run`: solo prepara un bundle local.
No hay scripts de despliegue automático ni integración Git habilitada.

Para desarrollo interactivo:

1. Crear una base **local separada**, por ejemplo `cheetahinvite_test`.
2. Copiar `.env.example` a `.env`: DATABASE_URL y DIRECT_URL exclusivamente de esa
   base. Aplicar `npx prisma migrate deploy` solamente allí.
3. Copiar `.dev.vars.example` a `.dev.vars` y poner la DATABASE_URL local.
   Next/Prisma CLI cargan `.env`; Wrangler carga `.dev.vars`. DIRECT_URL solo es
   necesaria en el proceso de migración, no como secreto del Worker.
4. `npm run dev`: puerto 3000 (APP_URL/AUTH_URL en `.env`).
   `npm run preview:workers`: bundle en puerto 8787 (`.dev.vars`).
5. R2 permanece local (`remote: false`). Las capturas reales requieren habilitar
   expresamente Browser Run remoto **de pruebas**. APP_URL debe ser accesible desde
   Cloudflare: el navegador remoto no puede navegar al localhost de esta máquina.
   No apuntarlo al sitio de producción. Las transformaciones Images también deben
   verificarse con el servicio real antes de aceptar la migración para producción.

## Recursos que debes crear — solo staging

No se han creado en esta tarea. En el [panel Cloudflare](https://dash.cloudflare.com/),
usar una cuenta de prueba o recursos independientes dentro de la cuenta elegida:

| Ubicación | Recurso/configuración |
| --- | --- |
| Storage & databases → R2 → Create bucket | `cheetahinvite-images-staging`, privado, sin dominio público ni r2.dev |
| Storage & databases → R2 → Create bucket | `cheetahinvite-cache-staging`, privado, separado del bucket de imágenes |
| Compute → Workers & Pages | Worker futuro `cheetahinvite-staging`; sin rutas al dominio de producción |
| Media → Images | Habilitar transformaciones para el binding `IMAGES` |
| Browser Run / Browser Rendering | Habilitar navegador para el binding `BROWSER` |
| Proveedor PostgreSQL | Proyecto/base **nuevo**, usuario propio y sin clientes; conexiones TLS desde Workers |

Bindings en `wrangler.jsonc`: `INVITATION_IMAGES`, `NEXT_INC_CACHE_R2_BUCKET`,
`IMAGES`, `BROWSER`, `WORKER_SELF_REFERENCE`, `NEXT_CACHE_DO_QUEUE`,
`NEXT_TAG_CACHE_DO_SHARDED`. Wrangler registrará los Durable Objects en un futuro
despliegue autorizado; no hace falta D1. No crear reglas de expiración sobre todo el
bucket: el borrado depende de referencias SQL. No hacen falta tokens S3, CORS ni
claves R2 para las cargas de la aplicación. El presupuesto CPU configurado de 30
segundos corresponde a Workers Paid. Para evaluar Free hay que retirarlo y medir
el consumo real, especialmente scrypt y SSR; todavía no se ha verificado ese consumo
en un despliegue remoto Free. Verificar también consumo de Browser Run/Images.

Antes de un futuro despliegue de pruebas, cambiar configuración a `APP_ENV=staging`,
`APP_URL=https://<host-de-staging>`, `AUTH_URL=https://<host-de-staging>` y
`AUTH_TRUST_HOST=true`. Conservar PayPal/Mercado Pago en sandbox. Aplicar migraciones
desde equipo/CI con DIRECT_URL de staging, nunca desde peticiones ni hooks de build.

### Secretos: en archivos locales o panel, nunca en el chat

Preview local: `.dev.vars`, ignorado por Git. Worker de pruebas: **Workers & Pages
→ cheetahinvite-staging → Settings → Variables and Secrets → Add → Secret**.
Alternativa, cuando exista el Worker: `npx wrangler secret put NOMBRE --name
cheetahinvite-staging`; ingresar el valor cuando Wrangler lo solicite en la terminal.
No poner secretos en wrangler.jsonc, commits ni mensajes de chat.

| Secreto | Origen de prueba |
| --- | --- |
| `DATABASE_URL` | Conexión TLS de la base nueva |
| `AUTH_SECRET` | Secreto aleatorio nuevo, distinto del de Vercel |
| `CRON_SECRET` | Otro secreto aleatorio nuevo |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Cliente OAuth de pruebas; callback `https://<host>/api/auth/callback/google` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe sandbox/test, `sk_test_...` y endpoint nuevo de staging |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` | Aplicación Sandbox separada |
| `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` | Aplicación y cuentas de prueba |
| `RESEND_API_KEY` | Opcional: dominio y destinatarios de prueba; configurar `RESEND_FROM_EMAIL` |

No reutilizar cookies ni credenciales OAuth/firmas de producción. Crear endpoints
de prueba nuevos `/api/stripe/webhook`, `/api/paypal/webhook`,
`/api/mercadopago/webhook` en staging, sin cambiar los existentes. Eventos:
`docs/payment-methods.md` y `docs/stripe.md`. Los secretos de build y de runtime
son almacenes distintos; no suministrar claves de pago al build si no las necesita.

## Aceptación pendiente en staging

- Registro, contraseña, Google OAuth, cierre/revocación y recuperación de acceso
  solo a direcciones de prueba.
- JPG/PNG/WebP/AVIF reales, archivos corruptos, SVG falso, más de 5 MiB, cupos,
  dos pestañas, eliminación durante carga y reintentos.
- Capturas Browser Run con fuentes e imágenes, versiones exactas y conservación
  del snapshot previo ante errores.
- Pago sandbox de cada proveedor: firmas válidas/falsas, duplicados, fuera de orden,
  reembolsos, disputas, OXXO pendiente y conciliación.
- Concurrencia PostgreSQL, aliases, PIN, RSVP, exportación, caducidad/cron sin visitas,
  reintentos R2 e invalidación de caché entre instancias.
- Límites CPU, tamaño del Worker, consumo y privacidad de buckets.

OAuth y pruebas remotas completas requieren estos recursos. La validación local
no sustituye esa aceptación. No se ha autorizado despliegue, DNS ni traslado de imágenes.
