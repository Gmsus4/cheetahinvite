# Cine · Red Carpet

Décimo diseño de cumpleaños, `birthday-cinema-v1`. Ejemplo local: `/ejemplo-invitacion/cumpleanos-cine`.

## Dirección visual

Una premiere personal: portada tipográfica sobre telón rojo, créditos del reparto, sinopsis en papel crema, ubicación como boleto con talón, programa como cartelera de rodaje y vestimenta junto a la fotografía de un foco de estudio. La música usa tela roja repetida y un disco; la confirmación ocupa una entrada con separación perforada. La cuenta regresiva recuerda los paneles de una sala de cine y el cierre usa créditos y claqueta.

Cinzel para títulos, Cormorant Garamond para notas cursivas y DM Sans para cuerpo y controles de 16 px. Negro, crema, rojo vino y dorado. El acento seleccionado se mantiene en botones, con texto negro o blanco según su luminancia. Las imágenes y texturas conservan sus colores originales. Galería bento sin decoraciones; las fotos se amplían en un visor compartido.

## Recursos

Doce archivos suministrados por el propietario, optimizados a WebP en `public/birthday/cinema/`, conservando transparencia y proporciones. Sin ampliación, máximo 1800 px por eje y calidad 88.

| Original | Recurso | Uso |
| --- | --- | --- |
| 6225087.jpg | deco-pattern | Patrón repetido de ubicación |
| Aputure STORM 80c…jpg | spotlight | Vestimenta |
| camara.png | camera-hand | Confirmación |
| camara2.png | camera | Confirmación |
| Capa 1.png | clapper | Programa y cierre |
| Capa 3.png | projector | Sinopsis |
| mascara.png | mask | Vestimenta |
| nikola-bikar-BTxwgNaEwHc-unsplash.jpg | curtain | Portada |
| pin.png | cinema-pin | Ubicación |
| red.jpg | red-fabric | Textura repetida de música |
| palomitas.png | popcorn | Regalos |
| disco.png | disc | Música; reemplaza el disco dibujado con CSS |

## Integración

Registrado en `invitation-templates`, selector, catálogo, `InvitationCanvas` y ruta de ejemplos. Seleccionar el diseño conserva datos personales y configura `cinzel`/`dm-sans`. Usa `RsvpForm` con `publicEventId`, confirmación externa y enlaces seguros. Las secciones desactivadas se omiten y las fotografías de galería se deduplican. Nombres y mensajes ficticios pertenecen exclusivamente al ejemplo; no se impone una edad.

## Bloques opcionales completos

Los bloques `story`, `ceremony`, `reception`, `parents` y `custom` tienen composiciones propias: carta de guion con margen y comillas, escenario con telón y reflectores, ficha de otra locación con marco art déco, créditos de personas especiales y nota de producción. Todos conservan título, texto, detalle, fotografía y enlace del cliente. No interpretan ni reemplazan nombres, horarios o direcciones escritos por el organizador.

El render recorre únicamente las secciones activas, manteniendo su orden. La composición depende del tipo de bloque, sin alternancia por posición par/impar, por lo que desactivar un vecino no cambia la identidad visual de otro. El ejemplo incluye los cinco para poder revisarlos; los borradores personales no reciben esos textos ficticios.

En esta ampliación pasaron 10 pruebas dirigidas, incluyendo las 32 combinaciones de activación de esos cinco bloques y el orden invertido. TypeScript, ESLint y análisis de CSS sin errores. Revisión visual en escritorio y móviles de 390/320 px, sin desbordamientos ni imágenes fallidas.

## Validación

TypeScript, ESLint y análisis de CSS sin errores. 49 pruebas de regresión aprobadas: registro y guardado, conservación de datos, recursos, enlaces, galería sin decoraciones, personalización y confirmaciones.

Revisión visual en escritorio de 1280 px y móviles de 390 y 320 px. Sin desbordamientos horizontales ni imágenes fallidas; controles del formulario verificados a 16 px. Portada, boleto, cartelera, vestimenta y formulario comprobados en navegador. Se reutiliza el formulario compartido en modo demostración en el ejemplo.

La alternancia dinámica de fondos, la galería bento sin adornos y el visor siguen [el comportamiento compartido de cumpleaños](birthday-shared.md).

## Rediseño de gala

La portada se convierte en una composición de dos columnas: nombre protagonista, nota de invitación y acceso al contenido a la izquierda; cámara de cine o foto personal a la derecha, dentro de un arco con sello de estreno. La alfombra roja se construye con CSS sobre el telón oscuro. La cámara sostenida se usa en portada y la cámara individual permanece en confirmación.

La identidad usa negro cálido, vino y champaña. Las secciones exteriores alternan dos tonos oscuros de ancho completo, mientras que guion, programa, boleto y confirmación conservan superficies claras para dar contraste editorial. La cuenta regresiva usa cifras separadas por líneas y el cierre recupera el vino de la portada. La miniatura del catálogo utiliza la misma dirección visual.

Se conservan todos los apartados editables, sus datos, los enlaces seguros, RSVP, galería, cuenta regresiva y personalización de acento. La portada se apila en móvil y admite nombres largos y fotografía opcional.
Contraste: ubicación y cuenta regresiva conservan títulos claros y etiquetas champaña sobre las bandas oscuras. Se retiraron las reglas compartidas de la versión clara que sobrescribían esos colores; los títulos de guion, boleto, programa y confirmación siguen oscuros sobre crema.
