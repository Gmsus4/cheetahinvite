# Contexto y guía de los diseños de invitaciones

Documento de continuidad de **Cheetah Invite**. Reúne el objetivo, las decisiones del propietario, la implementación actual, los recursos y el procedimiento para seguir con la colección. Actualizado al incorporar el décimo diseño de cumpleaños, **Cine · Red Carpet**.

Este documento describe el estado del repositorio local; no acredita un despliegue en producción ni que los cambios estén confirmados en Git. Ante discrepancias, comprobar los archivos actuales y las instrucciones de `AGENTS.md`.

## 1. Objetivo y alcance

El proyecto ya cuenta con **12 diseños de boda**. El propietario pidió crear una colección adicional de **12 diseños de cumpleaños**, trabajando uno por uno con las imágenes que va proporcionando.

Cada diseño debe tener una identidad visual propia y funcionar como invitación completa: portada, datos reales del evento, secciones opcionales, ubicación, confirmación de asistencia y vista previa. No basta con cambiar los colores de una misma plantilla.

Se deben conservar los diseños terminados y la compatibilidad con las invitaciones existentes. Los nombres y fechas ficticios se usan exclusivamente en los ejemplos públicos.

## 2. Colección de cumpleaños: estado y siguiente paso

La siguiente lista proviene de la propuesta inicial. Hay diez diseños implementados; los demás siguen siendo conceptos pendientes y pueden ajustarse con el propietario.

| Orden | Diseño | Estado | Dirección visual / recursos previstos |
| --- | --- | --- | --- |
| 1 | Confeti · Animalitos de fiesta | Implementado | Acuarela, algodón, papel, osito con globos, animalitos y confeti |
| 2 | Globos pastel | Implementado | Crema, azul suave, nubes, estrellas, pastel y personajes de pastelería |
| 3 | Neón | Implementado | Negro, letras luminosas, cian, fucsia, violeta y personajes espaciales |
| 4 | Disco | Implementado | Plata, lila, cromo, bolas de espejos y destellos tornasol |
| 5 | Elegante · Black & Gold | Implementado | Dirección editorial, negro, mármol, seda y serif fina; `/ejemplo-invitacion/cumpleanos-elegante` |
| 6 | Floral | Pendiente | Flores coloridas, hojas y arreglos |
| 7 | Tropical | Pendiente | Palmeras, flores tropicales y frutas |
| 8 | Espacial | Implementado | Azul profundo, planetas coloridos y astronautas; ruta `/ejemplo-invitacion/cumpleanos-espacial` |
| 9 | Dinosaurios | Implementado | Expedición jurásica, jungla verde profunda, crema y terracota |
| 10 | Arcoíris | Pendiente | Arcoíris, nubes y estrellas suaves |
| 11 | Gamer | Implementado | Consola arcade, violeta, crema, amarillo y personajes; `/ejemplo-invitacion/cumpleanos-gamer` |
| 12 | Fiesta mexicana | Pendiente | Papel picado, flores de papel y detalles festivos |
| Adicional | Cine · Red Carpet | Implementado | Premiere, telón rojo, cartelera y boletos; `/ejemplo-invitacion/cumpleanos-cine` |
| Adicional | Vaquero | Implementado | Rodeo, Rye, cuero y papel de caballos; `/ejemplo-invitacion/cumpleanos-vaquero` |

**Siguiente diseño: pendiente de indicación del propietario.** No crear automáticamente los cuatro diseños pendientes como parte de una petición de documentación.

La opción **Esencial** también está disponible en el selector. Es la composición genérica existente y **no cuenta** como uno de los doce diseños nuevos.

En el catálogo público de inicio (`/#personalizacion`), el filtro **Cumpleaños** muestra los diez diseños implementados, con las mismas miniaturas del editor y enlaces a sus ejemplos completos. La tarjeta base/Esencial se retiró de ese catálogo.

## 3. Indicaciones del propietario que deben mantenerse

- Crear diseños bonitos y cuidados, tomando el tiempo necesario para revisar el resultado.
- Utilizar las ilustraciones que entrega y las texturas que ya había proporcionado. No sustituirlas sin motivo por imágenes generadas.
- Incorporar los recursos de forma visible y coherente, repartidos en la invitación; evitar amontonarlos en la portada.
- El primer paso al crear una invitación debe ser **elegir el tipo de evento**.
- Todos los tipos de evento deben compartir la interfaz y funcionalidad del asistente que originalmente tenía boda.
- El grid de diseños debe verse igual en todos los tipos de evento: mismas tarjetas, proporciones, espacios, selección y comportamiento responsive.
- Cuidar especialmente los fondos: el propietario señaló varias veces cortes de textura, franjas vacías y laterales sin cubrir. Estas correcciones forman parte del resultado esperado, no son detalles pendientes.
- En Globos pastel se retiraron expresamente las frases **«Hoy el cielo está de fiesta»** y **«Un cumpleaños en las nubes»** porque evocaban una despedida o fallecimiento. No reintroducirlas. La portada actual dice **«¡ESTÁS INVITADO A MI CUMPLEAÑOS!»** y usa el nombre como título principal.
- Neón debe tener fondo negro, tipografía y luces de neón. Sus siete recursos ya están integrados.

## 4. Flujo común de creación y edición

Ruta de creación: `/crear`.

1. Se elige el tipo: boda, cumpleaños, graduación, baby shower, aniversario u otro evento.
2. Se abre el mismo asistente de cuatro pasos:
   1. **Tu celebración**: tipo y diseño.
   2. **Datos principales**: protagonistas/anfitriones, nombre de invitación, fecha, hora, lugar y dirección.
   3. **Dale tu toque**: color, fotografía opcional, mensaje y secciones.
   4. **Revisa y comparte**: revisión, pendientes, guardado y continuación al pago.

El asistente mantiene vista previa móvil/escritorio, vista ampliada, recuperación local, protección al salir y control de conflictos. Los tipos distintos de boda ya no deben volver a abrir una interfaz diferente.

Los borradores nuevos de cumpleaños empiezan con Confeti; el usuario puede cambiar a Globos pastel, Neón, Disco o Esencial. Seleccionar otro diseño conserva el contenido personal y aplica su color y tipografía recomendados.

Las secciones nuevas no se rellenan con historias, direcciones o datos de los ejemplos. La confirmación integrada se activa inicialmente; los demás detalles se activan según lo que el organizador quiera compartir.

Guardar un borrador incompleto sigue permitido. Para publicar los eventos distintos de boda se validan protagonista/anfitrión, fecha, hora, lugar, dirección y contenido de secciones activas. Boda conserva la validación correspondiente a sus identidades versionadas.

La creación del evento en el servidor se prepara al guardar o al necesitar subir una imagen. No consumir un espacio de invitación por abrir solamente la selección de tipo.

### Compatibilidad

- No renombrar los identificadores de diseños ya utilizados por eventos guardados.
- No reemplazar datos personales al cambiar de diseño.
- Mantener el renderizado público y privado coherente con la vista previa.
- Las confirmaciones antiguas sin `rsvpMode` explícito conservan el modo externo; no convertirlas silenciosamente en formularios integrados.
- El guardado, pago y publicación usan las acciones existentes. No crear un sistema de RSVP ni un pago paralelo para cada diseño.
- El asistente de boda se generalizó: `GuidedInvitationEditor.tsx` reemplaza el antiguo `GuidedWeddingEditor.tsx`.

## 5. Arquitectura y archivos importantes

| Archivo | Responsabilidad |
| --- | --- |
| `app/crear/page.tsx` | Entrada autenticada, límites de cuenta y recuperación de evento |
| `app/crear/actions.ts` | Preparación del borrador; conserva el identificador del diseño elegido |
| `components/dashboard/InvitationEditor.tsx` | Elección inicial del tipo y entrada al asistente común |
| `components/dashboard/GuidedInvitationEditor.tsx` | Asistente de cuatro pasos y vista previa |
| `lib/guided-invitation.ts` | Valores iniciales, detalles por evento, selección de diseño, paletas y validación |
| `lib/invitation-event-content.ts` | Etiquetas, textos base y ejemplos según el tipo de evento |
| `components/dashboard/InvitationDesignGrid.tsx` | Grid y tarjetas compartidos por todos los tipos |
| `components/dashboard/WeddingDesignPicker.tsx` | Opciones de boda dentro del grid compartido |
| `components/dashboard/EventDesignPicker.tsx` | Opciones de los demás eventos y miniaturas de cumpleaños |
| `components/dashboard/WeddingDesignPicker.module.css` | Estilos compartidos del grid y de las miniaturas, pese al nombre histórico |
| `lib/invitation-templates.ts` | Catálogo disponible y validación de `templateId` |
| `components/dashboard/EventEditor.tsx` | Contiene `InvitationCanvas`, que elige el renderizador; conserva también código del editor anterior y subida de imágenes |
| `components/invitation/RsvpForm.tsx` | Formulario compartido de asistencia |
| `components/invitation/CountdownTimer.tsx` | Cuenta regresiva compartida, extraída del renderizador anterior |
| `app/ejemplo-invitacion/[style]/page.tsx` | Rutas de ejemplo sin iniciar sesión y parámetros estáticos |
| `app/layout.tsx` | Importación de las hojas de estilo de los diseños |
| `app/dashboard/eventos/[id]/actions.ts` | Actualización y publicación |
| `app/dashboard/eventos/[id]/pago/actions.ts` | Validación al continuar al pago |
| `lib/payment-checkout.ts` | Comprobación de requisitos antes del checkout |

Los nuevos cumpleaños se agregan al catálogo en tiempo de ejecución junto con `templateManifest`. **No editar a mano `lib/generated-invitation-templates.ts`** para registrarlos: `templates:sync` lo regenera.

### Funciones principales del modelo guiado

- `guidedDetails` y `guidedSections`: detalles y secciones vacías por tipo.
- `guidedDesign`: etiqueta y paletas para el selector.
- `applyGuidedDesign`: aplica el diseño sin reemplazar el contenido personal.
- `completeGuidedSections`: conserva secciones existentes y completa opciones faltantes; normaliza el modo externo antiguo de RSVP.
- `initialGuidedValues`: valores iniciales sin hechos ficticios y conservación de datos existentes.
- `guidedPublicationIssues` y `eventPublicationIssues`: requisitos de publicación en interfaz y servidor.

Boda tiene sus propias paletas completas. En los cumpleaños actuales el selector común ofrece cuatro combinaciones; los renderizadores aplican el acento principal y conservan sus fondos y colores secundarios propios. No afirmar que todas las superficies cambian con la paleta.

## 6. Identificadores, renderizadores y ejemplos

| Diseño | Identificador persistido | Definición | Renderizador | CSS | Ejemplo |
| --- | --- | --- | --- | --- | --- |
| Confeti | `birthday-confetti-v1` | `lib/birthday-designs.ts` | `BirthdayConfettiInvitation.tsx` | `app/birthday-confetti.css` | `/ejemplo-invitacion/cumpleanos-confeti` |
| Globos pastel | `birthday-pastel-v1` | `lib/birthday-pastel.ts` | `BirthdayPastelInvitation.tsx` | `app/birthday-pastel.css` | `/ejemplo-invitacion/cumpleanos-globos-pastel` |
| Neón | `birthday-neon-v1` | `lib/birthday-neon.ts` | `BirthdayNeonInvitation.tsx` | `app/birthday-neon.css` | `/ejemplo-invitacion/cumpleanos-neon` |
| Disco | `birthday-disco-v1` | `lib/birthday-disco.ts` | `BirthdayDiscoInvitation.tsx` | `app/birthday-disco.css` | `/ejemplo-invitacion/cumpleanos-disco` |

Los cuatro componentes se encuentran en `components/invitation/` y se seleccionan en `InvitationCanvas`. Por compatibilidad actual reutilizan el tipo de propiedades `WeddingInvitationProps`; esto no significa que deban renderizarse como bodas.

En desarrollo, anteponer `http://localhost:3000` a las rutas de ejemplo. La cuenta regresiva usa actualmente UTC−6; no es un selector de zona horaria por evento.

## 7. Recursos originales y copias optimizadas

Origen de los recursos entregados en esta conversación: `C:/Users/ferna/Imágenes/cumpleaños/`.

La aplicación sirve las copias optimizadas de `public/birthday/`; no depende de que el servidor pueda acceder a la carpeta personal del propietario. Se conservaron los originales y su transparencia cuando existe. La conversión a WebP se hizo con `sharp`, disponible en el entorno del proyecto.

### Confeti: nueve archivos

Carpeta publicada: `public/birthday/confetti/`.

| Original | Copia WebP |
| --- | --- |
| `Birthday Stickers_ Dinosaur with Giftpng.png` | `dino-gift.webp` |
| `Birthday Stickers_ Tiger with a Party Hat or Balloonspng.png` | `tiger.webp` |
| `Confeti y serpentinas festivas flotantes.png` | `confetti.webp` |
| `descarga (1)png.png` | `bear.webp` |
| `descarga (2)png.png` | `elephant.webp` |
| `descarga (3)png.png` | `hedgehog.webp` |
| `descargapng.png` | `blue-dino.webp` |
| `globospng.png` | `balloons.webp` |
| `Happy Birthday Clipart_ Dinosaur with Party Hat and Balloonspng.png` | `party-dino.webp` |

Portada con osito y globos, banderines pastel y confeti. Elefante y erizo en bienvenida; dinosaurio azul en ubicación; otros personajes en las secciones. Los globos realistas se conservaron como recurso disponible, pero no son un adorno activo del renderizador actual.

Fuentes: Fredoka, Caveat y Nunito. Acento original: `#387D81`.

Texturas reutilizadas: `public/textures/wedding/cotton.webp` y `paper.webp`. También existen `linen.webp`, `gold-leaf.jpg` y `stationery-grain.svg`; su existencia no obliga a usarlas en todos los diseños.

### Globos pastel: once archivos, todos integrados

Carpeta publicada: `public/birthday/pastel/`.

| Original | Copia WebP | Uso principal |
| --- | --- | --- |
| `Capa 2png.png` | `bear-chef.webp` | Bienvenida y programa |
| `cupcakepng.png` | `cupcake.webp` | Bienvenida y regalos |
| `estrella2png.png` | `star-soft.webp` | Portada y cuenta regresiva |
| `estrellapng.png` | `star-gold.webp` | Portada y detalles |
| `nube1png.png` | `cloud-blue.webp` | Portada |
| `nube2png.png` | `cloud-light.webp` | Portada y confirmación |
| `nubes.jpg` | `sky.webp` | Fondo de portada y cuenta regresiva |
| `pastelpng.png` | `cake.webp` | Protagonista ilustrado de portada |
| `patopng.png` | `duck.webp` | Ubicación y cierre |
| `perritopng.png` | `puppy-chef.webp` | Bienvenida y vestimenta |
| `Globos y confeti de fiesta multicolor.png` | `balloons.webp` | Capa suave de globos en portada |

Fuentes: Comfortaa, Caveat y Nunito. Acento original: `#526F87`. Fondos crema, melocotón y azul suave. Mantener la corrección editorial de las frases de portada indicada arriba.

### Neón: siete archivos, todos integrados

Carpeta publicada: `public/birthday/neon/`.

| Original | Copia WebP | Uso principal |
| --- | --- | --- |
| `Astronauta Neón.jpg` | `astronaut.webp` | Portada y programa |
| `Cat💛.jpg` | `pixel-cat.webp` | Bienvenida y regalos |
| `Cinnamoroll.jpg` | `headphones.webp` | Bienvenida y música |
| `Confeti neón festivo flotante.png` | `confetti.webp` | Fondo luminoso de portada |
| `confetineonpng.png` | `party-popper.webp` | Confirmación |
| `naveneonpng.png` | `rocket.webp` | Portada y ubicación |
| `ovnipng.png` | `alien.webp` | Vestimenta y cierre |

Fuentes: Comfortaa, Caveat y DM Sans. Acento original: `#F46BDE`, combinado con cian y violeta sobre negro. Los JPEG negros se integran con `mix-blend-mode: screen`; el encuadre se ajusta con CSS. El formulario tiene tema oscuro propio, incluidos campos, selección, acompañantes, mensajes y botón.

El resplandor es estático: no añadir parpadeos o destellos rápidos. Mantener legibles los textos secundarios sin aplicar el halo intenso a todos los párrafos.

### Disco: once archivos integrados

Carpeta publicada: `public/birthday/disco/`.

| Original | Copia WebP | Uso principal |
| --- | --- | --- |
| `cascopng.png` | `helmet.webp` | Solo franja musical inicial |
| `casco2png.png` | `helmet-silver.webp` | Sección de música; sustituye el casco repetido |
| `Collage de fiesta disco brillante.png` | `collage.webp` | Fondo suave de portada |
| `disco2discopng.png` | `ball-purple.webp` | Bienvenida y programa |
| `disco3discopng.png` | `hanging-ball.webp` | Bola colgante de portada |
| `discodiscopng.png` | `ball-navy.webp` | Solo bienvenida; no repetir en cierre ni como adorno genérico |
| `estrelladiscopng.png` | `chrome-spark.webp` | Portada y cuenta regresiva |
| `perritodiscopng.png` | `balloon-dog.webp` | Bienvenida y regalos |
| `estrella2discopng.png` | `holo-star.webp` | Portada y ubicación |
| `estrellas3discopng.png` | `silver-stars.webp` | Vestimenta y cierre; sustituye recursos repetidos |
| `lapizpng.png` | `pencil.webp` | Confirmación; sustituye el destello repetido |

Fuentes: Outfit, Caveat y DM Sans. Acento original: `#7154A1`. Fondos plata y lila con detalles tornasol, nombre cromado y una franja musical oscura. Los fondos cubren el ancho completo; el contenido usa contenedores interiores. Los ocho recursos iniciales aparecen en la composición base. Las estrellas plateadas aparecen en vestimenta y cierre; el lápiz aparece en confirmación. Cuando se retire un recurso repetido, sustituirlo por otra ilustración apropiada; no limitarse a quitarlo.

## 8. Correcciones visuales realizadas: no repetir estos problemas

### Uniones horizontales de la textura

El algodón se repetía globalmente y sus uniones cruzaban títulos y formularios. Se sustituyó por una superficie sin repetición en cada bloque completo, con `background-size: cover` y `background-repeat: no-repeat`.

No confundir esas uniones con las líneas decorativas punteadas. Inicialmente se corrigieron los separadores, pero el problema señalado por el propietario era la repetición del fondo.

### Laterales vacíos

Al aplicar la textura a secciones con `max-width`, aparecieron franjas crema a izquierda y derecha. Se cambió a secciones de ancho completo; el contenido se centra mediante relleno interno o un contenedor interior.

Regla de composición: **el fondo cubre todo el bloque; el contenido puede tener ancho máximo**.

### Franja debajo de los animalitos

El margen superior de la ubicación dejaba un hueco sin textura después de la bienvenida. Se eliminó el margen externo y se mantuvo la separación como padding inferior de la bienvenida: 60 px en escritorio y 40 px en móvil.

Revisar siempre las uniones entre todos los bloques, no solamente la portada.

### Confeti oculto en la portada

El nuevo fondo de algodón tapó el pseudoelemento del confeti. Se recuperó el orden de capas con `isolation: isolate` en `.birthday-cover`, conservando el confeti encima del papel y detrás del contenido.

No eliminar la imagen original de confeti ni esconderla detrás de un fondo opaco.

### Grid diferente según el evento

El selector anterior de decoración no tenía el mismo estilo que el de boda. Se creó `InvitationDesignGrid`, ahora usado por los selectores de boda y demás eventos.

Mantener tres columnas en escritorio y dos en móvil, con las mismas proporciones, indicador de selección, foco de teclado y enlace de ejemplo. Los diseños sin recursos no deben aparecer como disponibles.

## 9. Procedimiento para implementar el siguiente diseño

1. Leer `AGENTS.md`. Antes de escribir código Next.js, consultar la guía correspondiente en `node_modules/next/dist/docs/`, tal como exige el proyecto.
2. Revisar este documento, los cuatro diseños actuales y los recursos nuevos entregados. No asumir que el siguiente concepto ya tiene aprobación visual ni archivos definitivos.
3. Definir una composición propia y repartir los recursos: portada, bienvenida, datos, secciones y cierre. Considerar una portada sin fotografía personal.
4. Guardar copias optimizadas en una carpeta nueva de `public/birthday/`, con nombres estables y comprensibles. Conservar los originales. Comprobar transparencia real y carga de archivos.
5. Crear una definición versionada en `lib/` con identificador, etiqueta, color, recursos y ejemplo ficticio. Mantener separadas las identidades existentes.
6. Registrar la plantilla disponible en `lib/invitation-templates.ts`.
7. Crear el renderizador en `components/invitation/` y su CSS propio en `app/`. Prefijar las clases para evitar afectar a otras invitaciones.
8. Registrar el renderizador en `InvitationCanvas` e importar el CSS desde `app/layout.tsx`.
9. Añadir la miniatura y el enlace de ejemplo en `EventDesignPicker`; reutilizar `InvitationDesignGrid` y sus estilos, sin inventar otro grid.
10. Añadir el ejemplo a `app/ejemplo-invitacion/[style]/page.tsx`, incluida su entrada en `generateStaticParams`.
11. Configurar tipografías y acento en `applyGuidedDesign`. Si se necesitan fuentes nuevas, revisar primero las ya instaladas y la carga local de fuentes.
12. Mantener las secciones editables, imágenes personales opcionales, programa, galería, enlaces, RSVP integrado/externo y cuenta regresiva. Propagar `publicEventId` al formulario real.
13. Revisar publicación y preparación del borrador: el diseño elegido debe persistir y conservar los datos personales.
14. Verificar visualmente portada e interiores en móvil y escritorio, fondos hasta los laterales, ausencia de huecos y legibilidad. Probar el formulario en el ejemplo sin enviar respuestas reales.
15. Ejecutar las comprobaciones adecuadas, actualizar la documentación específica y el estado de esta colección, y dejar una vista previa accesible al propietario.

No sustituir `InvitationCanvas` por una página estática desconectada del editor. No crear nuevos eventos reales ni efectuar pagos para mostrar el diseño.

## 10. Verificación y comandos

Desde la raíz del repositorio:

```powershell
# Desarrollo habitual; el predev genera Prisma y sincroniza recursos antiguos.
npm run dev

# Comprobación de tipos sin depender de que npx resuelva un ejecutable.
node node_modules/typescript/bin/tsc --noEmit

# Pruebas utilizadas al terminar Disco.
node --test tests/guided-invitation.test.cjs tests/invitation-templates.test.cjs tests/invitation-links.test.cjs

# Verificación de espacios y conflictos de parche.
git diff --check
```

Último resultado de ese conjunto: **19 pruebas correctas**, además de TypeScript sin errores. Es el resultado del subconjunto indicado, no de toda la suite. En una etapa anterior se ejecutó un conjunto más amplio de 66 pruebas de persistencia, guardado, plantillas, bodas y pagos; no confundir esos alcances.

En el navegador se verificaron Neón y Disco en escritorio y a 390 px: sin desbordamiento horizontal, sin imágenes fallidas y sin huecos entre secciones. Se probó el formulario en modo de demostración. Confeti y Globos pastel también se revisaron visualmente durante su implementación.

Las capturas de trabajo se han guardado temporalmente en `node_modules/.cache/`; no son recursos de la invitación ni documentación duradera. No depender de ellas para servir los diseños.

Los cambios existentes del dashboard, landing, tipografía general y recursos de boda no son una invitación a rehacer esas áreas. Revisar `git status` antes de trabajar y conservar los cambios ajenos al alcance del diseño.

### Feedback de Next.js

`AGENTS.md` pide retener problemas significativos y verificados de Next.js y hacer un pase de reporte antes de finalizar. Si hay candidatos reales, ejecutar una vez `npx --no-install next internal agent-feedback-instructions` y seguir sus indicaciones. No reportar depuración rutinaria ni incluir datos del proyecto, rutas, código o secretos.

## 11. Documentación complementaria

- [Editor compartido](docs/guided-invitation.md)
- [Confeti](docs/birthday-confetti.md)
- [Globos pastel](docs/birthday-pastel.md)
- [Neón](docs/birthday-neon.md)
- [Disco](docs/birthday-disco.md)
- [Gamer](docs/birthday-gamer.md)
- [Vaquero](docs/birthday-cowboy.md)
- [Elegante · Black & Gold](docs/birthday-elegant.md)
- [Diseños de boda](docs/wedding-designs.md)
- [Dirección artística y recursos de boda](docs/wedding-identities-resources.md)
- [Protección y recuperación del editor](docs/editor-protection.md)
- [Confirmación de asistencia](docs/rsvp.md)
- [Almacenamiento de imágenes](docs/cloudinary-storage.md)
- [Stripe](docs/stripe.md)

## 12. Resumen para retomar en otra sesión

> Estamos ampliando Cheetah Invite de 12 diseños de boda a una colección propuesta de 12 cumpleaños. Ya se implementaron Confeti, Globos pastel, Neón y Disco con recursos del propietario. Todos los eventos comparten el asistente de cuatro pasos y el mismo grid de diseños. Los fondos deben cubrir todo el ancho y no repetir texturas que corten el contenido ni dejar huecos entre bloques. Confeti conserva su imagen de confeti en la portada. En Globos pastel se quitaron las frases que evocaban una despedida; no reintroducirlas. Neón usa negro, halos de luz y formulario oscuro. Mantener los IDs versionados, datos personales, RSVP y vistas coherentes. Disco usa plata, lila y acabados cromados, con sus once imágenes integradas. El siguiente concepto previsto es Elegante dorado, todavía pendiente de recursos e implementación. Consultar los archivos y las instrucciones actuales antes de continuar.

## Diseño Espacial

Quinto diseño implementado: `birthday-space-v1`. Recursos originales convertidos a 17 WebP en `public/birthday/space/`. Componente `BirthdaySpaceInvitation.tsx`, estilos `app/birthday-space.css` y registro `lib/birthday-space.ts`. Disponible en el asistente, catálogo público y vista de ejemplo. Mantiene ubicación, galería, programa, cuenta regresiva y RSVP compartidos. Los recortes originales conservan sus fondos; no se ha aplicado eliminación automática.

## Dinosaurios: sexto diseño implementado

Identidad `birthday-dinosaur-v1`; ejemplo `/ejemplo-invitacion/cumpleanos-dinosaurios`. Los 16 recursos proporcionados están optimizados en `public/birthday/dinosaur/`, conservando su transparencia. Portada con jungla y dos dinosaurios, tarjetas de cuaderno de exploración, volcán, ubicación con palmera, programa, RSVP con cría, cuenta regresiva con huevos y hojas en el cierre. Usa Fredoka/Nunito/Caveat, verde profundo, crema y acento terracota personalizable. Mantiene las funciones compartidas: secciones opcionales, galería, ubicación, enlaces, RSVP integrado o externo y guardado. Disponible en el catálogo público y selector de creación.


## Gamer: séptimo diseño implementado

Identidad `birthday-gamer-v1`; ejemplo `/ejemplo-invitacion/cumpleanos-gamer`. Doce recursos optimizados en `public/birthday/gamer/`, con la transparencia de las once ilustraciones conservada. Portada de consola, tarjetas de jugadores, ubicación como checkpoint, paneles para todas las secciones y terreno de Minecraft en la cuenta regresiva. Outfit/Nunito, textos de 16 px, bordes oscuros y sombras desplazadas. Compatible con fotos opcionales, programa, galería, enlaces, RSVP integrado/externo y guardado compartidos. Ver [documentación de Gamer](docs/birthday-gamer.md).

### Preferencias vigentes de los interiores de cumpleaños

Las galerías de todos los diseños de cumpleaños, incluido Esencial, muestran fotos y textos sin ilustraciones decorativas. Los apartados con poco contenido deben tener una composición integrada, con tarjetas, marcos y fondos coherentes; evitar dejar únicamente una ilustración suelta y un párrafo. Mantener los textos de lectura a 16 px. No añadir líneas de cuaderno detrás de los párrafos. Separar visualmente los datos y los botones.


## Vaquero: octavo diseño implementado

Añadido a la colección inicial a petición del propietario. Identidad `birthday-cowboy-v1`; ejemplo `/ejemplo-invitacion/cumpleanos-vaquero`. Quince recursos vigentes en `public/birthday/cowboy/`. Rediseñado como escenas: cartel de rodeo, boleto con talón para ubicación, ruta de horarios, prendas sobre papel de caballos, carta de regalos, saloon musical, recibo RSVP y etiquetas de calendario. `textura.webp` sustituye la piel moteada por cuero; `textura2.jpg` aporta el papel de caballos. Rye para títulos, Nunito para lectura y Caveat para notas. Textos de 16 px y galería sin adornos. Integrado en el asistente, catálogo y guardado comunes. Ver [documentación de Vaquero](docs/birthday-cowboy.md).


## Elegante · Black & Gold: noveno diseño implementado

Identidad `birthday-elegant-v1`; ejemplo `/ejemplo-invitacion/cumpleanos-elegante`. Once recursos optimizados en `public/birthday/elegant/`. Portada editorial con nombre, mármol y globos; bienvenida de brindis, ubicación en dos columnas, programa de cena, seda en vestimenta, marco de regalos, música y formulario oscuro. Cormorant Garamond/DM Sans, lectura de 16 px, fotografía personal opcional y galería sin adornos. La colección completa de ilustraciones queda disponible como recurso, reservada para no saturar la composición. Conserva el editor, guardado, RSVP y datos personales comunes. Ver [documentación](docs/birthday-elegant.md).

## Décimo diseño: Cine · Red Carpet

Implementado en catálogo, selector, editor y ejemplo. Portada de estreno sobre telón, sinopsis con proyector, ubicación como boleto, programa como plan de rodaje, vestimenta con fotografía de iluminación de estudio y confirmación como entrada. Galería sin adornos. Ver [documentación de Cine](docs/birthday-cinema.md).
