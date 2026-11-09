# Administración de Cheetah Invite

## Acceso

Se utiliza `/login`, con los proveedores existentes (Google o correo y contraseña).
El registro siempre crea cuentas `USER`. El acceso administrativo depende de
`User.role = ADMIN`, consultado en la base de datos en cada acción y solicitud.
La autenticación también refresca ese rol en la sesión. El menú de cuenta incluye
«Administración» para esas cuentas y abre `/admin`. Las rutas y las acciones
comprueban el permiso en el servidor, incluso cuando se invocan directamente.

Aplicar las migraciones y generar el cliente antes de iniciar:

```powershell
npx prisma migrate deploy
npx prisma generate
```

Asignar el rol a una cuenta ya registrada, desde un entorno de operación autorizado:

```powershell
npm run admin:access -- grant correo@ejemplo.com
npm run admin:access -- revoke correo@ejemplo.com
```

Estos comandos no crean cuentas. El correo no se añade a una lista pública ni a
variables `NEXT_PUBLIC_`. Retirar el rol invalida el acceso administrativo en la
siguiente solicitud. No se permite elegir el rol desde el registro ni el perfil.

## Diseños y ejemplos

La migración no crea ejemplos ni invitaciones. La colección administrativa empieza
vacía. Los ejemplos originales del sitio se conservan hasta que el administrador
active «Usar mi colección en el hero».

1. Crear un ejemplo indicando nombre, tipo y, opcionalmente, su enlace.
2. Completar su contenido con el mismo editor de invitaciones existente.
3. Guardar y revisar el borrador privado.
4. Publicar explícitamente desde la ficha del ejemplo.
5. Activar «Mostrar en el hero», elegir el orden y activar la colección propia.

Se admiten varios ejemplos del mismo tipo. El hero permite seleccionar cada uno.
La colección vacía activa presenta un estado sin invitación; no genera contenido.
Los ejemplos tienen eventos `isExample = true`, no consumen espacios de cliente y
no se pueden pagar. Los ejemplos originales no se importan a la colección.

`ShowcaseExample.publishedContent` es una instantánea. Guardar o recuperar un
borrador nunca actualiza esa versión pública. Publicar comprueba la versión y los
datos completos. Retirar conserva el borrador y cierra su ruta pública. Solo se
pueden eliminar ejemplos retirados. La duplicación es una acción explícita y crea
un borrador. La colección admite hasta 100 ejemplos.

Las fotos publicadas se conservan aunque se sustituyan en el borrador. La limpieza
de Cloudinary revisa también las instantáneas publicadas. El hero sigue utilizando
las imágenes locales optimizadas y versiones de entrega pequeñas para Cloudinary;
los archivos originales y las invitaciones completas conservan su calidad.

## Precio

`PriceRevision` conserva cambios inmutables con motivo, autor y fecha de aplicación.
Sin revisiones vigentes se utiliza el precio original de `INVITATION_PRICE`.
El precio se consulta en cada solicitud: los cambios programados entran en vigor
sin reiniciar ni desplegar. El formulario usa hora de Ciudad de México. Se pueden
cancelar cambios futuros. El precio permitido va de $10 a $999,999 MXN, IVA incluido.
La vigencia comercial sigue siendo 12 meses.

El apartado de precios del sitio, preguntas frecuentes, editor, pantalla de pago y Checkout
consultan la misma fuente. Cada `InvitationPayment` conserva su importe reservado.
Una sesión anterior pendiente se comprueba y vence antes de abrir otra al precio
actual; un pago ya completado se recupera al importe original. No se modifican
compras anteriores. La confirmación sigue verificando moneda, importe y propietario.

## Clientes, ventas y pagos

Clientes permite buscar cuentas y consultar sus eventos, privacidad, vencimiento,
compras y cortesías. No muestra PIN, contraseñas, claves de acceso ni permite
entrar en la cuenta del cliente. Los enlaces protegidos conservan su control de PIN.

Ventas separa producción de pruebas, busca por correo, evento o referencia,
filtra estados y permite consultar el detalle y conciliar con Stripe. La acción
de actualización mantiene la pausa de 30 segundos por compra. Los reembolsos y
disputas se operan en Stripe; el webhook existente actualiza su registro local.
Los importes «cobros menos reembolsos» no descuentan comisiones ni disputas.

## Cortesías

Se otorgan a borradores ya existentes, con motivo y fecha de vencimiento. Su
vigencia comienza al otorgarlas. Nunca se crea un pago ficticio ni se escribe
`paidAt`; `complimentaryAt` representa el permiso gratuito y `CourtesyGrant` conserva
el historial. Las ventas y sus importes excluyen estas autorizaciones.

Si el evento está completo y tiene privacidad elegida, se publica al otorgar la
cortesía. Si faltan datos, permanece privado hasta que el propietario los complete
y pulse «Publicar cortesía». La reserva de enlaces sigue utilizando el registro
global y sus restricciones de unicidad. Los formularios de asistencia y el PIN
funcionan también en invitaciones de cortesía.

Una cortesía no puede reemplazar una compra, un ejemplo ni un pago pendiente o
fallido sin cerrar. Antes de otorgarla hay que resolver esos pagos desde Ventas. Retirarla
requiere un motivo y cierra el acceso gratuito, conservando contenido e historial.
Una cortesía anterior debe retirarse antes de otorgar otra al mismo evento.

El destinatario recibe un aviso en su panel con el nombre de la invitación y su
vigencia. «Abrir mi invitación» y la X marcan ese aviso como leído. `CourtesyGrant.readAt`
guarda la lectura en la cuenta, de forma que el aviso no regresa al recargar ni
al entrar desde otro dispositivo. La etiqueta «Cortesía» de la tarjeta permanece
durante la vigencia; cerrar el aviso no retira el regalo. Cada nueva cortesía
tiene su propia lectura. No se envía un correo automático.

## Estadísticas

Periodos de 7, 30 y 90 días, con días de Ciudad de México. Incluyen compras reales,
importes, eventos creados, cortesías, visitas estimadas al inicio y selecciones de
ejemplos. El gráfico y la tabla accesible muestran cobros menos reembolsos por día.

La navegación se mide desde esta implementación, sin reconstruir actividad previa.
El navegador guarda un identificador aleatorio en `sessionStorage`; el servidor
solo conserva un HMAC rotado por día para deduplicar. No se guardan IP, correos,
identificadores originales, cookies ni historial individual. Se respetan DNT y GPC,
y se excluye al administrador. Los bloqueadores pueden reducir los datos.

`/api/analytics` valida origen, tamaño, tipo de evento y ejemplos existentes.
Tiene presupuestos persistentes por sesión y globales, independientes del navegador.
La limpieza oportunista elimina presupuestos vencidos y registros de navegación
anteriores a 90 días. Las estadísticas son aproximadas y no representan usuarios únicos.

## Auditoría y verificación

`AdminAudit` registra cambios de precio, publicación, presentación, origen de
ejemplos, cortesías y asignación de roles. El resumen muestra la actividad reciente.

```powershell
npm test
npm run lint
npm run build
npm run typecheck
```

Las pruebas administrativas usan servicios aislados y PostgreSQL embebido para
comprobar la migración sin crear ejemplos, invitaciones ni cobros en la base real.
