# Textos comerciales y legales

Revisión del código y de los textos: **18 de noviembre de 2026**.
Páginas: `/terminos` y `/aviso-de-privacidad`.

La revisión describe la implementación de esta rama preparada para Cloudflare.
No acredita contratos, configuración ni comportamiento de un despliegue de
producción. Quedan datos y decisiones del operador por completar.

## Datos del responsable y mantenimiento

- Responsable del servicio y de privacidad: **Fernando Gómez Montes**.
- Correo vigente: **cheetahinvite@gmail.com**.
- Teléfono: **33 5141 5751**, con enlace internacional `+523351415751`.
- El propietario confirmó nombre, correo y teléfono el 18 de noviembre de 2026;
  indicó que contratará otro correo posteriormente, sin proporcionar aún uno nuevo.
- **Domicilio completo pendiente de proporcionar**. Se muestra expresamente
  como pendiente en ambos documentos; no debe inferirse del teléfono.

Nombre, domicilio, teléfono y fecha de revisión se centralizan en `lib/legal.ts`.
El correo se toma de `SUPPORT_EMAIL` en `lib/support.ts`, compartido con soporte.
Cuando exista el nuevo correo, actualizar esa constante y revisar las menciones
restantes del correo anterior en el proyecto. Cambiar una constante no configura
un buzón ni actualiza automáticamente sus documentos históricos.

## Condiciones contrastadas con el código

| Función | Condición actual | Referencia |
| --- | --- | --- |
| Cuenta | Hasta tres invitaciones, incluidos borradores; crear y previsualizar gratis | `lib/limits.ts` |
| Precio | Importe base de $269 MXN, IVA incluido; admite revisiones programadas desde administración. Los términos remiten al total mostrado antes de pagar | `lib/invitation-payment.ts`, `lib/site-pricing.ts` |
| Publicación | Pago confirmado o cortesía vigente, datos requeridos y privacidad elegida | `lib/courtesy.ts`, `lib/guided-invitation.ts` |
| Privacidad | Pública o protegida con PIN de seis dígitos; sesión de invitado de doce horas; cambiar PIN o privacidad invalida accesos anteriores | `lib/invitation-pin.ts`, `lib/invitation-access.ts`, acciones de ajustes |
| Imágenes | Hasta 5 MiB de entrada y doce fotos por galería; almacenamiento y cargas limitados | `lib/limits.ts` |
| Archivos directos | El PIN protege la página; las URL directas de imágenes siguen accesibles para quien las conoce | `app/api/media/[...key]/route.ts` |
| Vista previa al compartir | Datos de portada en modo público; metadatos genéricos en modo protegido | `lib/invitation-metadata.ts` |
| Asistencia integrada | Nombre y apellido, Sí/No y acompañantes adicionales configurables de cero a diez; no pide correo, teléfono ni nombres de acompañantes | `lib/rsvp.ts` |
| Lista de asistencia | Consulta, CSV y eliminación por propietario; clave local para recuperar una respuesta; nombres sin verificar | `lib/rsvp-storage.ts`, `components/invitation/RsvpForm.tsx` |
| Pagos | Stripe, PayPal y Mercado Pago según configuración; OXXO opcional con Stripe; una ficha no publica | `lib/payment-providers.ts`, `components/dashboard/PaymentMethods.tsx` |
| Vigencia | Doce meses naturales del pago verificado; mes natural de archivo posterior, sin enlace ni edición; renovación manual para compras elegibles | `lib/invitation-lifecycle.ts` |
| Cortesías | Vencimiento explícito, sin cobro ni renovación de compra pagada; mismo archivo posterior | `lib/courtesy.ts`, `lib/invitation-lifecycle.ts` |
| Reembolsos | Total confirmado retira publicación; parcial mantiene vigencia. Disputas y contracargos aplican controles del proveedor | `lib/payment-status.ts`, `lib/payment-invalidation.ts` |
| Soporte | El botón prepara un correo; el usuario debe enviarlo. Recuperación automática alternativa con Resend si se configura | `lib/support.ts`, `docs/password-recovery.md` |

La política comercial conserva reembolsos por fallas propias que impidan prestar
el servicio y por cobros duplicados del sistema, sin excluir derechos legales.
Las devoluciones procedentes de pagos OXXO requieren gestión separada, porque
Stripe no ofrece su reembolso directo. No se ha añadido un servicio de facturación
automática que no existe en el proyecto.

## Responsabilidad del Organizador, datos de terceros y reportes

La cláusula general identifica como Organizador al titular de la cuenta que crea
y administra la invitación. Le atribuye responsabilidad por el contenido y los
datos que incorpora, su exactitud, su relación con el evento y las autorizaciones
necesarias para compartirlos y utilizarlos. La regla alcanza borradores,
publicaciones, acceso con PIN y difusión de las invitaciones.

Las reclamaciones por falta de consentimiento, datos incorrectos, infracción de
derechos o uso indebido se atribuyen al Organizador cuando deriven de su conducta.
Se incluye la obligación de mantener a salvo a Cheetah Invite únicamente cuando
proceda legalmente, por responsabilidades y gastos razonables y acreditados
derivados del incumplimiento del Organizador. No se excluyen actos u omisiones
de la plataforma ni se trasladan sus obligaciones propias.

La redacción se adapta a las funciones existentes: no afirma que el Organizador
importe teléfonos de invitados ni que el sistema envíe invitaciones o recordatorios
automáticamente. El formulario integrado recibe respuestas de los invitados.
Tampoco se clasifica a Cheetah Invite como encargado para todo tratamiento: los
roles y acuerdos correspondientes deben verificarse por finalidad y operación.

Se ofrece reporte por el correo vigente, sin exigir cuenta, con enlace,
descripción y evidencias mínimas. La atención es manual: el enlace prepara un
correo, sin detección automática, ticket ni plazo garantizado de resolución.
Los términos permiten retirar o suspender contenido y limitar acceso por uso
indebido; no se implementa con esta edición un nuevo sistema de moderación.
El aviso de privacidad incorpora los datos y finalidades de esos reportes y
distingue este canal del ejercicio de derechos ARCO.

## Proveedores y flujo de datos

- **Cloudflare Workers, R2, Images y Browser:** alojamiento preparado en esta rama,
  nuevas imágenes, transformaciones y capturas. PostgreSQL permanece externo.
- **Base PostgreSQL:** verificar la entidad contratada y su región en el entorno
  que se publique. La documentación anterior mencionaba Neon; el tipo PostgreSQL
  del código no demuestra por sí solo qué proveedor recibe datos en producción.
- **Cloudinary:** se siguen mostrando referencias históricas. No recibe nuevas
  cargas de esta implementación y la cola R2 no elimina sus archivos.
- **Google/Gmail:** autenticación opcional, datos de perfil y credenciales técnicas
  que persiste el adaptador; correo enviado a soporte.
- **Stripe, PayPal y Mercado Pago:** datos que recibe el proveedor seleccionado
  y referencias financieras conservadas por la aplicación.
- **Resend:** correo y enlace de recuperación automática cuando se utiliza.
- **Spotify, YouTube, Apple Music y SoundCloud:** reproductores incrustados que
  pueden conectarse al cargarse, antes de reproducir. WhatsApp, mapas y regalos
  añaden destinatarios externos según los enlaces del organizador.

Pendiente verificar contratos, entidades, regiones, subencargados y la
clasificación jurídica de encargos y transferencias. No se ha afirmado que
los datos se almacenen exclusivamente en México.

## Tecnologías y conservación verificadas

| Datos o tecnología | Comportamiento |
| --- | --- |
| Cookies Auth.js | Sesión y seguridad; controles temporales OAuth de hasta quince minutos cuando se usan. Inventariar cookies y duraciones efectivas del dominio desplegado |
| Cookie de PIN | Token por evento, hasta doce horas; servidor guarda hash y vencimiento |
| Límite de PIN | Huella derivada de evento e IP; ventanas de quince minutos, limpieza al volver a comprobar PIN; no confundir con ausencia total de tratamiento de IP |
| Clave RSVP local | Aleatoria por evento, sin vencimiento automático del navegador; servidor guarda hash, respuesta y fechas |
| Copias locales del editor | Recuperables siete días; traslado a vista privada, treinta minutos. Limpieza al usar las funciones, sin garantía de borrado físico al vencer |
| Preferencias | Tema y ayudas del editor en almacenamiento del navegador |
| Medición opcional propia | Visitas al inicio y selección de ejemplos; identificador de sesión, claves derivadas por día sin correo ni IP en los registros; respeta DNT y GPC |
| Registros de medición | Se retiran los mayores de noventa días mediante limpieza oportunista en nuevas visitas; no es un borrado puntual garantizado |
| Evento vencido | Un mes natural de archivo y posterior eliminación del evento, respuestas, enlaces y sesiones; requiere ejecución de la tarea configurada |
| Imágenes R2 | Cola de borrado con reintentos; temporales sin uso disponibles para limpieza después de veinticuatro horas |
| Imágenes Cloudinary | Sin eliminación automática en esta rama; gestionar retirada y migración por separado |
| Historial de compras | Sobrevive a la eliminación del evento o cuenta; sin purga general automática implementada |
| Soporte, auditoría, registros y respaldos | Sin política de plazos completa ni purga general verificable en el repositorio |
| Borradores sin compra | Excluidos de la eliminación por vencimiento; se conservan hasta eliminación o solicitud procedente |

El cron de `worker.ts` está preparado para ejecutar el mantenimiento cada cinco
minutos. Es necesario configurar, desplegar y comprobar su ejecución real.
La eliminación física de imágenes puede retrasarse por reintentos o referencias
aún utilizadas. Las copias de terceros y CSV descargados no se retiran desde la app.

El cierre de cuenta se solicita a soporte. Se retiró la promesa anterior de
“hasta tres meses” porque no existe un flujo implementado que la respalde y no
debe sustituir los plazos de atención de derechos. Los términos tampoco prometen
eliminar automáticamente imágenes antiguas de Cloudinary.

## Pendientes del operador antes de dar por definitivos los textos

1. Completar el domicilio real en `lib/legal.ts`.
2. Definir información fiscal y procedimiento de emisión de comprobantes.
3. Verificar proveedores, acuerdos, regiones y transferencias de producción.
4. Aprobar plazos de conservación y bloqueo de compras, soporte, auditoría,
   registros técnicos y respaldos; implementar las purgas correspondientes.
5. Concretar el procedimiento operativo de cierre de cuenta y de atención ARCO,
   con verificación proporcional de identidad y seguimiento de solicitudes.
6. Confirmar inventario de cookies y conexiones externas en el sitio desplegado,
   incluidas las pantallas de terceros y los reproductores incrustados.
7. Verificar migración o retirada de archivos antiguos de Cloudinary y ejecución
   de la cola R2 y del cron en el entorno final.

No se han inventado domicilio, correo futuro, proveedor de base de producción
ni plazos de retención no aprobados. La actualización editorial no certifica
cumplimiento ni sustituye una revisión jurídica de la operación concreta.

## Referencias oficiales consultadas

Consultadas el 18 de noviembre de 2026:

- [Ley Federal de Protección de Datos Personales en Posesión de los Particulares](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf):
  identidad y domicilio del responsable, aviso y atención de derechos; artículos
  15 y 27 a 34.
- [Ley Federal de Protección al Consumidor](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf):
  información y condiciones de contratación electrónica, artículo 76 Bis;
  límites a cláusulas que excluyen responsabilidad del proveedor, artículo 90.
- [Código Civil Federal](https://www.diputados.gob.mx/LeyesBiblio/pdf/CCF.pdf):
  referencia federal sobre responsabilidad por actos ilícitos y daño moral,
  artículos 1910, 1916 y 1916 Bis. La legislación y autoridad aplicables deben
  determinarse según el caso.

Los enlaces a estas leyes se incluyen también en las páginas legales.
