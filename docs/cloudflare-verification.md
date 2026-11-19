# Verificación local — 17 de noviembre de 2026

Worktree: `cheetahinvite-cloudflare`; rama: `codex/migrate-cloudflare`.
No hubo despliegues, cambios DNS, migraciones de imágenes ni operaciones sobre
servicios, buckets o bases de producción. `master` permanece en `06099d3`.

| Comprobación | Resultado |
| --- | --- |
| Compilación Next/OpenNext | Correcta con Next 16.4.6, OpenNext 1.20.17, SSR y Prisma workerd |
| TypeScript | Sin errores |
| ESLint | Sin errores; una advertencia anterior de variable no utilizada en InvitationShowEditor |
| `git diff --check` | Sin errores |
| Suite unitaria | 485 de 493 correctas; los ocho fallos también se reprodujeron en el commit inicial |
| R2/cupos/limpieza/cron | 26 de 26 pruebas específicas correctas tras la revisión final |
| PostgreSQL temporal | Seis suites correctas: almacenamiento, editor, ciclo de vida, pagos, enlaces y RSVP |
| workerd + PostgreSQL + R2/Images locales | Correcto: registro/scrypt, sesiones sucesivas y concurrentes, revocación, carga/recodificación/entrega, PIN privado, firma Stripe y limpieza |
| Captura con Chromium local aislado | Correcto: espera contenido visible transmitido y decodificación de imágenes |
| Wrangler dry-run | Correcto, sin despliegue; 17.680,63 KiB sin comprimir y 4.444,14 KiB gzip |

Los ocho fallos existentes están en `creation-journey.test.cjs` (2),
`editor-save-exit.test.cjs` (4) e `invitation-rendering.test.cjs` (2). Se compararon
con una copia del commit inicial extraída dentro de `.cloudflare-test/`; esa
comparación ejecutó 98 pruebas, con los mismos ocho fallos. No se modificó la
carpeta original para realizarla.

Se actualizaron fixtures SQL antiguas para establecer privacidad y vigencia
explícitas, y para utilizar imágenes R2 en las pruebas de limpieza. Los proveedores
de pago permanecieron simulados en las suites SQL. El webhook Stripe en workerd
usó una firma de prueba generada localmente, sin llamadas a Stripe.

Hallazgos resueltos durante la migración:

- Cache Components/PPR bloqueaban la respuesta de documentos en workerd. Se usa
  SSR y se conservan las invalidaciones; no reactivar sin pruebas concurrentes.
- El cliente Prisma de Node intentaba compilar WASM dinámicamente. El generador
  `runtime = "workerd"` permite el módulo WASM estático y pasó consultas reales.
- El tracing WASM incorporaba herramientas de desarrollo y WASM ajenos. Se
  excluyen esos binarios y se conservan explícitamente los dos assets OG de Next.
- Windows requiere junctions para algunos enlaces de OpenNext; el ajuste está
  en los scripts del proyecto y no modifica dependencias instaladas.
- Los temporales de Wrangler se excluyen de ESLint para evitar analizar bundles
  generados. Las bases temporales se cierran con PostgreSQL pg_ctl en Windows.

Quedan pendientes las comprobaciones con recursos remotos separados: Google OAuth,
Browser Run, formatos y capturas en el servicio real de Images, pagos sandbox de
los tres proveedores, webhooks externos y observación del cron/CPU en staging.
Recursos, secretos y procedimientos: [guía de migración](cloudflare-migration.md).

## Despliegue gratuito — 18 de noviembre de 2026

Sitio de pruebas: <https://cheetahinvite-staging.fergomez-js.workers.dev>.
Se mantuvo Workers Free. No se contrató Workers Paid, Images Paid ni un dominio.
Los buckets R2 usan Standard, permanecen privados y no tienen dominios públicos.
El propietario confirmó que PostgreSQL es exclusivo de pruebas; la comprobación
de migraciones encontró cero pendientes y no modificó el esquema.

| Comprobación | Resultado |
| --- | --- |
| Next/OpenNext, TypeScript y ESLint de los scripts modificados | Correctos |
| Wrangler dry-run | 17.680,67 KiB; dentro del límite Free de 64 MiB |
| Protección de variables locales del artefacto | Prueba correcta; escaneo del bundle final sin valores de secretos locales |
| Pruebas locales enfocadas | 15 correctas: R2, cron, Prisma y sanitización del entorno |
| Registro y login reales con contraseña | Correctos, cuenta sintética |
| Panel y editor en navegador | Carga completa y guardado confirmado |
| Subida, procesamiento y entrega de imagen | PNG real convertido a WebP y entregado desde R2, HTTP 200 |
| Browser Run remoto | Demo publicada con captura WebP de 390 × 830 y 12.652 bytes |
| Retirada y permisos de prueba | Demo volvió a borrador; rol USER restaurado; administración dejó de estar accesible |
| Limpieza autenticada | HTTP 200, cero fallos; sin autorización devuelve 401 |
| Firma Stripe remota | Evento sintético ignorado: firma válida 200, firma falsa 400; sin crear cobros |

Las pruebas son acotadas y no demuestran capacidad bajo carga. Las muestras de
registros mostraron llamadas exitosas con CPU superior al límite nominal de Free;
no tomar estas pruebas como una garantía de funcionamiento sostenido con tráfico.
No se debilitó scrypt ni la validación de imágenes para hacerlas pasar.

Durante la preparación se comprobó que el adaptador incluía variables privadas
locales en su módulo de entorno generado. No se desplegó ese artefacto. El build
del proyecto ahora conserva únicamente variables públicas en ese módulo y retira
copias de archivos de entorno de las funciones. El chequeo de despliegue rechaza
artefactos que omitan esta sanitización. Los valores remotos proceden de secretos
y bindings de Cloudflare, cargados con autorización específica del propietario.

Pendientes externos: Google OAuth fue aplazado por el propietario (callback de
staging ausente en el cliente de otra cuenta); recuperación por correo requiere
crear/configurar Resend; pagos sandbox completos y webhooks de proveedores no
se dan por verificados solo por tener sus credenciales cargadas.

El [registro de evidencia sandbox](payment-sandbox-evidence.md) permite documentar
las pruebas existentes y las nuevas por proveedor y caso, con referencias,
notificaciones/HTTP, estados y fechas antes/después y capturas depuradas. La
preparación del registro no da esos recorridos por verificados.

R2 ya tiene facturación por uso activada. El uso gratuito incluido no es un corte
monetario: mantener pruebas pequeñas y vigilar el consumo. Procedimientos y
estado de recursos: [configuración de Cloudflare](cloudflare-setup.md).
