# Revisión de lanzamiento — 9 de noviembre de 2026

Alcance: continuidad del producto, creación y edición de invitaciones, publicación, experiencia de invitados y operación. Se excluyen los diseños de eventos pendientes y los textos legales por indicación del propietario.

La base funcional está avanzada: hay recuperación local, control de conflictos, restricciones por propietario, pagos con conciliación e idempotencia, PIN, RSVP y CSV. La prioridad es que estas piezas formen un recorrido comprensible y que la operación externa esté verificada.

Esta es una revisión del código local y sus comprobaciones automáticas. La inspección visual no pudo continuar porque el control del navegador no pudo verificar la URL de la ventana. Los comportamientos indicados como hallazgos de código no equivalen a una reproducción visual. Tampoco se verificaron cuentas de proveedores, configuración del despliegue o cobros reales.

## Corregir antes de abrir ventas

### 1. Conservar el destino después de iniciar sesión o registrarse

**Actualización: implementado.** El acceso con correo y Google, el registro y el cambio entre ambas pantallas conservan un destino interno validado. Los enlaces para reautenticarse durante creación y pago mantienen la invitación correspondiente; `/crear` también conserva `resume` y `tipo`. Sin un destino válido se utiliza el panel. Se agregaron pruebas aisladas de navegación, propagación de parámetros y rechazo de destinos externos. El recorrido real de Google con su proveedor sigue requiriendo una comprobación en el dominio publicado.

**Hallazgo original.** Las rutas protegidas enviaban un `callbackUrl`, pero el acceso con contraseña, Google y el acceso posterior al registro fijaban `/dashboard` como destino. El enlace entre iniciar sesión y registrarse tampoco conservaba el destino.

**Ejemplo:** una persona pulsa «Crear mi invitación», crea su cuenta y termina en el panel teniendo que volver a empezar la navegación. Si la sesión expira al editar una invitación, el acceso tampoco la devuelve directamente a esa invitación.

**Resultado esperado:** conservar un destino interno validado durante login, registro, Google y recuperación. Al volver a autenticarse, reabrir el borrador correspondiente y ofrecer recuperar los cambios locales.

**Referencias:** `components/login/LoginForm.tsx:23`, `components/login/RegisterForm.tsx:49`, `components/auth/GoogleSignInButton.tsx:12`, `components/login/AuthAccountSwitch.tsx`.

### 2. Permitir guardar y salir desde cualquier paso

**Actualización: implementado.** Los seis pasos ofrecen «Guardar y salir», con confirmación del servidor antes de volver al panel. El aviso de navegación también permite guardar y continuar al destino elegido. Se distinguen el guardado en cuenta y la copia local; los borradores muestran «Continuar» y el panel permite recuperar creaciones locales de la cuenta. Se verificaron los seis pasos con pruebas aisladas, los errores y conflictos, y el recorrido real de guardar y retomar un borrador en navegador, incluido el diseño móvil. No se necesita completar los requisitos de publicación para guardar un borrador.

**Hallazgo original.** La creación conservaba el avance en el dispositivo, pero el guardado explícito del asistente aparecía en revisión. Preparar un evento para subir una fotografía tampoco significaba que todos los textos ya estuvieran guardados en la cuenta. El panel no presentaba el recuperador de creaciones locales que sí aparecía en la selección del tipo de evento.

**Ejemplo:** alguien escribe los nombres y el lugar, sale y entra desde otra computadora. La copia local del primer dispositivo no viaja con su cuenta. Sin fotografías ni guardado explícito, todavía puede no existir un evento en el servidor.

**Resultado esperado:** «Guardar y salir» en todos los pasos, un estado visible que distinga «Guardado en tu cuenta» de «Copia en este dispositivo» y «Continuar tu invitación» en el panel. Al salir, ofrecer guardar, seguir editando o salir con copia local. Mantener la posibilidad de guardar datos incompletos.

**Referencias:** `components/dashboard/GuidedInvitationEditor.tsx`, `components/dashboard/EditorLeaveDialog.tsx`, `components/dashboard/DashboardContent.tsx`, `lib/editor-persistence.ts`.

### 3. Evitar que abrir la vista previa aplique cambios publicados sin explicarlo antes

**Hallazgo de código.** `openPrivatePreview()` llama a `saveNow(false)`. En una invitación publicada, esa llamada guarda los cambios en el mismo contenido que sirve el enlace público. El aviso de que se guardaron aparece después de la acción.

**Ejemplo:** el organizador cambia la dirección para probar y pulsa «Abrir vista previa». Puede actualizar lo que ven los invitados antes de decidir aplicar esa modificación.

**Resultado esperado:** previsualizar los valores en edición sin aplicarlos al enlace público. Si se conserva el comportamiento actual, el botón debe anticiparlo claramente, por ejemplo «Guardar cambios y abrir vista previa». El editor visual ya permite ver cambios en memoria; conviene unificar la experiencia.

**Referencias:** `components/dashboard/GuidedInvitationEditor.tsx:181`, `components/dashboard/InvitationShowEditor.tsx`, `app/dashboard/eventos/[id]/actions.ts:60`.

### 4. Integrar privacidad y PIN en el último paso

**Actualización: implementado.** El asistente guarda el contenido y la privacidad de forma atómica con sus acciones habituales. La revisión incluye el acceso y los requisitos del PIN; desaparece «Guardar privacidad» del asistente. Estos cambios activan la protección al salir, conservan las versiones independientes y evitan que un cambio concurrente de acceso pase inadvertido al continuar al pago. El PIN nuevo se puede copiar; las copias locales no lo guardan en texto plano y piden volver a introducirlo al recuperar un cambio pendiente.

**Hallazgo original.** La selección de privacidad tenía estado y botón de guardado independientes. El listado de pendientes del asistente no incluía la privacidad. El servidor sí impedía publicar cuando seguía en `UNSET`, lo cual protegía el pago, pero podía producir un rechazo que parecía contradecir la revisión.

**Ejemplo:** elegir «Protegida con PIN» y pulsar directamente «Continuar al pago» sin haber pulsado «Guardar privacidad». Si había una opción anterior guardada, el servidor seguirá usando esa opción.

**Resultado esperado:** que continuar guarde de forma explícita el contenido y la privacidad elegida, o bloquee el avance indicando exactamente qué falta guardar. Incluir esos cambios en la protección al salir. Mostrar en revisión el acceso que realmente quedará activo y recordar al organizador que comparta el PIN.

**Referencias:** `components/dashboard/InvitationPrivacySettings.tsx`, `components/dashboard/GuidedInvitationEditor.tsx:105`, `app/dashboard/eventos/[id]/actions.ts:105`.

### 5. Hacer que cancelar un cuadro de edición afecte solo a ese cuadro

**Hallazgo de código.** En el editor visual, `cancel()` descarta todos los cambios y restaura el último snapshot guardado. También se usa al cerrar el selector de secciones y al pulsar la X.

**Ejemplo:** cambiar la alineación de un bloque mediante sus controles, abrir «Agregar secciones» y cerrarlo puede deshacer también la alineación que estaba pendiente.

**Resultado esperado:** cerrar un selector sin alterar cambios previos; para cancelar una edición, recuperar el estado que existía al abrir ese cuadro. Reservar «Descartar todos los cambios» para una acción global explícita.

**Referencia:** `components/dashboard/InvitationShowEditor.tsx:86`.

### 6. Dar prioridad a la recuperación automática de contraseña

**Hallazgo de código.** La pantalla presenta primero un proceso manual por correo y deja el enlace automático dentro de un desplegable. El procedimiento manual dice que el equipo asignará una contraseña y la enviará por correo.

**Impacto:** recuperar el acceso depende de atención humana incluso cuando ya existe una alternativa automatizada. Es especialmente problemático para quien necesita corregir urgentemente una invitación ya compartida.

**Resultado esperado:** enlace automático como opción principal, con entrega comprobada desde el dominio de producción. Soporte debe ayudar a iniciar el restablecimiento; el usuario elige su contraseña. Evitar enviar contraseñas por correo, conforme a la [guía de recuperación de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

**Referencias:** `app/recuperar-contrasena/page.tsx`, `components/login/ManualPasswordRecovery.tsx:36`, `docs/password-recovery.md`.

### 7. Completar la protección de registro e inicio de sesión

**Hallazgo limitado al repositorio.** No se observó limitación de intentos en el registro ni en la autorización con contraseña. El registro crea cuentas sin comprobar la propiedad del correo. Sí hay límites para recuperación, PIN, fotografías y RSVP, pero esos controles no sustituyen los de acceso y creación de cuentas. Podrían existir controles del proveedor de despliegue que aquí no se pueden verificar.

**Resultado esperado:** límites persistentes de intentos, respuestas y reintentos comprensibles, y una decisión explícita sobre verificación del correo y protección de registro automatizado. Los cupos por cuenta de imágenes pierden eficacia frente a la creación masiva de cuentas.

**Referencias:** `auth.ts:18`, `app/api/register/route.ts:11`, `docs/cloudinary-storage.md`. Recurso: [protección del acceso según OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#login-throttling).

## Pulido de alto valor para el lanzamiento

| Punto | Qué se observó | Mejora propuesta |
| --- | --- | --- |
| Recorrido largo | Hay seis pasos principales, cinco decisiones de estilo y después un recorrido de bloques. | Permitir «Usar estilo recomendado» y seleccionar primero los bloques que se quieren incluir. Mantener la personalización detallada disponible. Validar esta propuesta con usuarios. |
| Dos formas de editar | El asistente abre una vista previa que también es un editor. En móvil se ofrece la instrucción «Pasa sobre una sección». | Explicar «Editor paso a paso» y «Edición sobre la invitación»; adaptar las instrucciones a tocar en móvil y dar una salida clara. |
| Pantalla posterior al pago | Confirma publicación y permite abrir la invitación, pero compartir y personalizar el enlace quedan repartidos en otras pantallas. | Un cierre de recorrido con copiar enlace, compartir, recordar PIN si aplica y acceso directo a respuestas. |
| Compartir | El botón «Compartir» copia el enlace. | Nombrarlo «Copiar enlace» o abrir las opciones nativas de compartir cuando estén disponibles. Ofrecer texto preparado para WhatsApp; el envío queda en manos del organizador. |
| Confirmaciones | El máximo de cinco acompañantes es fijo. No hay fecha límite específica de RSVP ni cierre independiente de la visibilidad del bloque. | Permitir 0/1/N acompañantes por evento y «Cerrar confirmaciones» conservando el bloque y las respuestas. No hace falta construir un sistema de pases para la primera versión. |
| Fotos desde el teléfono | Se aceptan JPG, PNG, WebP y AVIF, hasta 5 MB; no hay conversión en el cargador para otros formatos. | Probar archivos originales de los teléfonos objetivo, incluidos HEIC y fotos de más de 5 MB. Ofrecer conversión/reducción o instrucciones útiles antes del error. Mostrar progreso en cargas de varias fotos. |
| Cupos de imágenes | Hay 20 intentos por hora por cuenta. | Hacer visible el cupo y cuándo vuelve a estar disponible. Una galería de 12 imágenes, portada, fondo y varios reemplazos pueden consumirlo en una sesión. |
| Hora del evento | La cuenta regresiva usa un desplazamiento fijo UTC−6. | Indicar el horario asumido o permitir una zona del evento si se venderá en otras zonas. La hora debe depender del evento. |
| Fecha frente a vigencia | La vigencia empieza al pagar y el asistente no contrasta la fecha del evento con el año comprado. | Advertir antes de pagar si la celebración queda fuera de la vigencia; avisar también si la fecha elegida ya pasó. |
| Invitación no disponible | Los enlaces no publicados o fuera de vigencia terminan en la página 404 general. | Mensaje neutro para invitados: «Esta invitación no está disponible; consulta con quien te la compartió», sin revelar el motivo privado del organizador. |
| Ayuda | El formulario prepara un correo; no envía una solicitud desde la web. | Facilitar copiar el correo y el mensaje completo, e indicar claramente cuándo se ha recibido realmente la solicitud. Un sistema de tickets puede esperar. |
| Descubrimiento y promoción | Las invitaciones tienen metadatos sociales; no se encontraron sitemap, robots ni una imagen social propia de la portada comercial. | Completar el SEO y la vista de enlace de la página comercial. Decidir explícitamente si se desea indexar invitaciones personales públicas. |
| Medición | Se registran visitas al inicio y selecciones de ejemplos, además de datos de ventas. | Medir inicio de creación, paso completado, llegada a revisión, inicio de pago y publicación para localizar abandonos; evitar registrar textos o datos de invitados. |

Las propuestas de esta tabla no tienen todas el mismo peso. Para una primera versión, priorizar compartir, instrucciones móviles y un límite de acompañantes comprensible; calendario, QR, búsqueda avanzada y automatizaciones comerciales pueden esperar a que exista demanda.

## Verificaciones operativas necesarias

Estas son comprobaciones pendientes de evidencia, no afirmaciones de que los servicios estén mal configurados:

1. **Compra completa en Stripe Sandbox:** crear, pagar, volver, abrir desde otro navegador y confirmar asistencia. Repetir con pago cancelado, retorno perdido, webhook repetido y reembolso. No confundir la aprobación de pruebas aisladas con la configuración real de Stripe.
2. **Autenticación real:** probar Google en el dominio definitivo, registro, cierre de sesión y recuperación automática con entrega del correo. Revisar el mensaje de error si el mismo correo ya usa otro método de acceso.
3. **Migraciones y tarea programada:** verificar que el esquema publicado tiene las migraciones actuales y que el Worker de limpieza corre. El repositorio contiene el Worker, pero desplegar la app no lo activa; el ejemplo de configuración tiene `APP_ORIGIN` vacío.
4. **Respaldos y restauración:** confirmar cobertura de PostgreSQL y archivos, permisos y un ensayo de restauración en un entorno separado. Una copia de seguridad sin restauración probada no demuestra recuperación.
5. **Alertas y errores recuperables:** comprobar cómo se detectan fallos de pago, base de datos, limpieza y correo. Solo se encontró un `error.tsx` dentro de administración; añadir una experiencia de reintento adecuada para el panel y el resto de la aplicación.
6. **Costos y rendimiento móvil:** comprobar consumo y alertas de Cloudinary y del alojamiento. Al cierre de la revisión, los componentes de invitación usan imágenes con `unoptimized`; ese componente no genera variantes por tamaño de pantalla. Revisar también las transformaciones de la URL de Cloudinary antes de decidir cambios. Medir una invitación real con varias fotografías y conservar una calidad visual adecuada. No se midió lentitud de usuario en esta revisión.

Para rendimiento y accesibilidad, [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) permite revisar páginas públicas o autenticadas. Complementarlo con teléfonos reales y enlaces abiertos desde WhatsApp; un resultado automatizado no prueba todo el recorrido.

## Prueba de aceptación propuesta

Usar cuentas y datos desechables en un entorno de prueba:

- Entrar sin sesión desde «Crear», registrarse y llegar directamente a la creación.
- Completar solo los primeros datos, guardar y salir, y continuar desde otro dispositivo.
- Cortar la conexión durante edición y durante una carga; recuperar los textos y reintentar sin crear otra invitación.
- Abrir el mismo borrador en dos pestañas y resolver el conflicto sin sobrescribir silenciosamente.
- Llegar a revisión, elegir PIN y continuar al pago con el acceso correcto guardado.
- Cancelar Checkout, volver al borrador y completar después una sola compra.
- Abrir la invitación desde un navegador sin sesión; comprobar PIN, mapas, enlaces y formulario de asistencia.
- Editar una invitación publicada y revisar cambios sin alterar el enlace público hasta la acción acordada de guardado.
- Cambiar un detalle visual, abrir otro cuadro y cancelarlo sin perder el primer cambio.
- Confirmar, actualizar la respuesta desde el mismo navegador y comprobar los totales y el CSV del organizador. Verificar la limitación conocida de duplicados entre dispositivos.
- Probar iPhone/Safari, Android/Chrome, teclado móvil abierto, nombres largos y fotografías reales; revisar botones tapados, desplazamiento horizontal, contraste y controles táctiles.

Como validación de claridad, observar a tres a cinco personas que creen una invitación sin instrucciones. Registrar dónde necesitan ayuda y dónde abandonan. Es una propuesta de prueba, no un resultado obtenido en esta revisión.

## Criterio para lanzar

Resolver primero los siete puntos de continuidad, acceso y recuperación, y reunir evidencia de las verificaciones externas. Después realizar una salida controlada con pocos usuarios y soporte disponible. Las funciones adicionales deben responder a fricciones observadas; no es necesario completar un catálogo de características para empezar a vender.

## Comprobaciones ejecutadas

- `npm test`: 282 pruebas aprobadas, cero fallos, en la repetición sobre el estado actualizado.
- `npm run lint`: cero errores y una advertencia de import sin uso en `app/ayuda/page.tsx`, en la repetición sobre el estado actualizado. La primera ejecución tuvo otras tres advertencias en componentes de imágenes que después se retiraron por cambios concurrentes.
- `npm run typecheck`: finalizó correctamente.
- `npm run build`: no verificado. Se detuvo la ejecución iniciada sobre el estado anterior al detectarse cambios concurrentes en los archivos de imágenes; todavía seguía en compilación y no había emitido un resultado. Esto no demuestra un error del proyecto ni permite afirmar que la compilación de producción pasa.
- No se ejecutaron las integraciones que crean y eliminan fixtures en PostgreSQL ni cobros, envíos de correo o cargas a proveedores.

No se modificó código funcional. El árbol ya tenía cambios de imágenes al comenzar; se revisó ese estado y se respetó el trabajo existente.
