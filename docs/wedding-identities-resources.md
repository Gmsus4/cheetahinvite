# Colección de bodas · Segunda edición

## Revisión actual de la colección

Las diez propuestas renovadas usan `WeddingCollectionInvitation` y `CollectionCover`, con CSS propio aislado de los diseños anteriores. Olivo y lino y Carta de amor conservan su renderizador y composición originales.

Las ilustraciones activas se leen directamente de `public/plantillas/boda/plantillaX`, mediante el manifiesto existente. Jardín usa plantilla1; Flor de cerezo, plantilla2; Bugambilias, plantilla3; Flores amarillas, plantilla4; Floral romántico, plantilla5; Olivo, plantilla6; Mediterránea, plantilla7; Carta de amor, plantilla8. No se reemplazan ni regeneran estos archivos durante esta revisión. Las ilustraciones experimentales de IA no se usan en la colección.

La nueva dirección incluye arco floral con rosas, portada editorial asimétrica, lazo de papelería para Minimalista, sobre abierto para Jardín, retrato circular para Cerezo, curvas vino y papel rasgado para Bugambilias, tarjeta festoneada para Flores amarillas, billete perforado para Mediterránea, marco geométrico sin abanicos para Art Déco y carta celeste para Bajo las estrellas. Los interiores continúan cada lenguaje en itinerarios, álbum y confirmación. Los apartados siguientes documentan la evolución previa y los recursos opcionales.

Las nueve referencias se interpretaron como dirección de arte: materiales coherentes, decoración que continúa por la página, secciones con personalidad y datos fáciles de encontrar. Sus logotipos, textos, capturas y fotografías no se publican como recursos. No se añadieron reproductores de música, QR ni mapas ficticios por aparecer en las referencias.

Carta de amor y Olivo y lino conservan la esencia de sus portadas. Los doce diseños desarrollan ahora el concepto en bienvenida, lugares, itinerario, galería, confirmación y despedida. La composición se adapta a móvil y escritorio y contempla invitaciones sin fotografía.

## Ajustes de composición solicitados

Floral romántico integra ahora la tarjeta botánica y el retrato en una portada de dos columnas, con algodón continuo entre portada y bienvenida. Editorial usa una portada más compacta con fotografía y nota caligráfica; se retiraron las iniciales, los ampersands decorativos y los números. Minimalista elimina el monograma circular y coloca todos los títulos encima del contenido, incluida la confirmación dentro de una única tarjeta centrada.

Las dos piezas de Jardín de azafrán tienen la misma altura en escritorio. Bugambilias cambia sus arcos fotográficos por impresiones de álbum y repite las esquinas florales a baja intensidad en los interiores. Flores amarillas tiene una portada más corta de dos piezas. El itinerario mediterráneo centra los iconos dentro de sus medallones. Art Déco elimina las numeraciones (incluido el contador CSS) y los abanicos de los interiores; el abanico de la portada se conserva. Bajo las estrellas elimina la numeración y presenta una galería rectangular con una imagen principal y dos secundarias. Olivo y lino y Carta de amor se conservan.

Las texturas adicionales usan algodón, fibras y lino existentes, con un grano SVG repetible sin costuras. Los fondos oscuros mezclan el grano suavemente. Se evita extender texturas con bordes impresos como mosaicos. Las fuentes adicionales ya están disponibles localmente: Cormorant Garamond, EB Garamond, Lora, Libre Baskerville y acentos Alex Brush.

## Ver y comparar

- `/disenos-boda`: galería interactiva, seis paletas por diseño, vista móvil/escritorio y opción sin fotografía.
- `/ejemplo-invitacion/boda-floral` (y el `kind` de los otros diseños): invitación completa sin cuenta. Datos exclusivamente ficticios.
- El selector del asistente muestra la invitación real a escala y ofrece abrirla completa.

## Dirección y recursos pendientes

Todos los diseños funcionan con las imágenes disponibles. Estos recursos son mejoras de acabado, no requisitos para usarlos. Conviene suministrar ilustraciones en PNG/WebP transparente o SVG, de una misma familia y sin texto incorporado. No incluir rostros, lugares ni nombres dentro de las ilustraciones decorativas.

| Diseño | Identidad y composición | Recurso que ayudaría a terminarla | Sustituto actual / slot |
| --- | --- | --- | --- |
| Floral romántico | Arco botánico clásico; foto horizontal bajo los nombres; capítulos centrados y galería con arcos. Referencia 1. | Dos guirnaldas verticales de flores blancas o rosadas con tallos finos, mínimo 800 × 1800 px; un pequeño ramo de la misma familia. | Colección 5: `topLeft`, `bottomRight`, `flower`. |
| Editorial elegante | Revista de bodas; cabecera, fotografía con nota caligráfica, portada compacta e interiores sin numeración. | Ninguna ilustración necesaria. Para mostrar su potencial, una sesión fotográfica con retratos verticales y fotos horizontales de detalles. | Fotos de demostración existentes. Las fotografías de cada pareja se cargan en el editor. |
| Minimalista | Papelería marfil; caligrafía, hilo de corazón, foto rectangular, calendario y confirmación centrada en una tarjeta de papel. Referencia 5. | Ningún recurso obligatorio. Opcional: textura de papel marfil de bajo contraste, repetible, mínimo 1200 px. | Algodón existente: `texture`. El hilo se construye en código; no hay monograma circular. |
| Jardín de azafrán | Invitación violeta con doble marco, recuerdo fotográfico inclinado, calendario y programa sobre tinta profunda. Referencia 3. | Ramas violetas alargadas y flores pequeñas sueltas, mínimo 1000 px por lado. Conservar ligereza y fondo transparente. | Colección 1: `topLeft`, `bottomRight`, `flower`. |
| Flor de cerezo | Página de primavera; retrato circular, órbita fina, flor superpuesta y capítulos de curvas asimétricas. | Una rama de cerezo colgante y una flor suelta de la misma colección, mínimo 1200 y 400 px respectivamente. | Colección 2: `topLeft`, `bottomRight`, `flower`. |
| Bugambilias | Álbum de hacienda; fotografías impresas rectangulares, fondo de vino, tarjetas claras y esquinas botánicas repetidas sutilmente. Referencia 9 interpretada con sobriedad. | Bugambilia realista o acuarela con caída natural; una esquina y una rama vertical, mínimo 1000 × 1600 px. | Colección 3, flores disponibles: `topLeft`, `bottomRight`, `flower`. |
| Flores amarillas | Jardín de verano; medallón solar, fotografía impresa, programa de pequeños medallones y separadores punteados. | Flores amarillas botánicas más delicadas y menos saturadas, mínimo 1000 px; opcional una pequeña flor prensada. | Colección 4: `topLeft`, `bottomRight`, `flower`. Sol e iconos en código. |
| Olivo y lino | Se conserva la tarjeta de lino y foto impresa; ramas de olivo, itinerario lineal y álbum con impresiones. Referencia 6 como apoyo. | No requiere recursos nuevos. Opcional: una rama horizontal de olivo para separadores, coherente con la colección actual. | Colección 6, recursos originales y textura de lino. |
| Costa mediterránea | Postal; marca circular de iniciales, cerámica desplazada, limones, calendario y tarjeta del destino. Referencias 1 y 2, sin fingir un billete de transporte. | Patrón de cerámica azul repetible, mínimo 800 px, y ramo de limones transparente, mínimo 1000 px. Los actuales ya funcionan. | Colección 7: `texture`, `flower`. |
| Art Déco | Gala; abanico solo en portada, marcos escalonados, interiores sin numeración y fotografías con esquinas recortadas. | Ningún recurso obligatorio. Opcional: metal mate fino, sin brillos fuertes, para sustituir la textura de oro. | Geometría SVG/CSS y `gold-leaf.jpg` existente, propiedad `foil` del diseño. |
| Carta de amor | Se conserva el sobre abierto, sello y recuerdo impreso; la carta continúa en hojas, anotaciones y álbum. Referencias 3, 5 y 9. | No requiere recursos nuevos. Opcional: esquinas florales más aireadas si se desea suavizar el papel. | Colección 8: cuatro esquinas, sello (`flower`), mariposa (`decoration`) y papel. |
| Bajo las estrellas | Atlas celestial; luna, órbitas, programa de constelaciones sin numeración y galería rectangular con una imagen principal. | Ningún recurso obligatorio. Opcional: cielo azul de grano fino y pocas estrellas para una versión aún más sobria. | Cielo, nebulosa y luna existentes, propiedades `celestial.sky`, `.nebula`, `.moon`. |

## Cómo reemplazar los recursos

1. Guardar las nuevas ilustraciones bajo `public/wedding-identities/<kind>/`.
2. Registrar únicamente los slots reemplazados en `lib/wedding-identity-assets.ts`. Las demás imágenes se conservan automáticamente.
3. Para oro y recursos celestiales, aplicar el cambio únicamente a la definición v2 de `weddingDesigns`, nunca al catálogo `legacyWeddingDesigns`.
4. Revisar portada e interiores a 390 px y 1280 px, con y sin foto, y con las seis paletas. Mantener las imágenes decorativas fuera del texto y del formulario.

No reemplazar los archivos de `public/plantillas/` para este acabado: también los usan invitaciones anteriores. Los identificadores `wedding-…-v1` siguen resolviendo el renderizador original; las nuevas composiciones se guardan como `wedding-…-v2`. Cambiar de diseño es una decisión explícita del propietario.
