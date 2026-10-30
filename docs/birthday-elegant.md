# Elegante · Black & Gold

Noveno diseño de cumpleaños. Identidad `birthday-elegant-v1`; ejemplo `/ejemplo-invitacion/cumpleanos-elegante`.

Dirección editorial de cena formal: negro profundo, dorado champán, Cormorant Garamond de peso ligero y DM Sans para lectura. El nombre protagoniza la portada junto a un panel vertical de mármol y globos. El mensaje de bienvenida se presenta como un brindis; la ubicación se ordena en dos columnas, el programa se compone como un menú, la vestimenta sobre seda, regalos con un marco ornamental, música con textura tenue y RSVP con formulario oscuro. La cuenta regresiva usa grandes números y separadores finos, sin tarjetas.

La lectura, las etiquetas y los controles conservan 16 px; los títulos y elementos tipográficos de exhibición tienen su propia jerarquía. Las decoraciones son estáticas, sin parpadeos. La galería no contiene ilustraciones, marcos ni etiquetas decorativas.

## Recursos

Los once originales se optimizaron como WebP en `public/birthday/elegant/`, conservando su transparencia. Los archivos originales no se modificaron.

| Original | WebP | Uso |
| --- | --- | --- |
| `Capa 2.png` | `palm` | Acento en vestimenta |
| `Capa 3.png` | `balloons` | Portada |
| `Colección de fiesta negra y dorada.png` | `party-collection` | Recurso disponible; reservado para conservar la sobriedad de la composición |
| `Confeti dorado flotante sobre fondo transparente.png` | `confetti` | Bordes de la cuenta regresiva, con opacidad baja |
| `Copas de champán doradas brindando.png` | `champagne` | Brindis de bienvenida |
| `dark.jpg` | `marble` | Panel vertical de portada |
| `descarga.jpg` | `silk` | Portada y vestimenta |
| `Hoja Monstera Dorada de Lujo.png` | `monstera` | Ubicación |
| `Ipad.jpg` | `onyx-pattern` | Textura tenue de música |
| `Marco ornamental dorado art déco.png` | `ornament-frame` | Mensaje de regalos |
| `Ondas Doradas sobre Transparencia.png` | `gold-waves` | Cierre |

## Funcionalidad

`BirthdayElegantInvitation.tsx` recibe los mismos datos de `InvitationCanvas`. La foto personal opcional ocupa el panel vertical y el adorno de globos reduce su tamaño. Todas las secciones opcionales conservan sus textos, detalles, fotos y enlaces. No se supone una edad a partir del nombre ni se introducen edades en eventos nuevos; los cuarenta años corresponden exclusivamente al mensaje ficticio del ejemplo.

Se mantienen el formulario compartido, `publicEventId`, confirmación externa, cuenta regresiva, enlaces seguros, galerías y datos personales al cambiar de diseño. El formulario tiene campos, selección, acompañantes, estados y botones adaptados al fondo oscuro. El texto del botón cambia entre negro y blanco según la luminancia del acento.

Registrado en el selector, catálogo y ejemplo. Seleccionarlo configura `cormorant-garamond`/`dm-sans` y acento `#D4B77A`. Los materiales negro, mármol y seda permanecen propios del diseño.

## Verificación

TypeScript y ESLint sin errores, CSS analizado y 44 pruebas de regresión aprobadas. Cubren registro, conservación de datos, preparación/guardado con tipografía, recursos disponibles, galería sin adornos, enlaces, confirmaciones y personalización sin edades ficticias.

Revisión visual en escritorio de 1280 px y móviles de 390 y 320 px: sin desbordamientos horizontales ni imágenes fallidas. Se comprobó el formulario en modo demostración, su confirmación y el panel de acompañantes; los controles y etiquetas mantienen 16 px. Los acentos oscuros reciben una variante clara para las etiquetas, manteniendo el color seleccionado en los botones y bordes.
