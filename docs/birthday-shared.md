# Comportamiento compartido de cumpleaños

Confeti, Pastel, Neón, Disco, Dinosaurios, Gamer, Vaquero, Elegante y Cine usan `BirthdayGallery` y `app/birthday-shared.css`. Espacio conserva su implementación equivalente.

Cada diseño calcula `sectionOffset` con los bloques iniciales que realmente se muestran, incluida la ubicación opcional. Los apartados se filtran por `enabled` antes de asignar su posición. `data-birthday-band` alterna las superficies `base` y `tinted`, también al reordenar apartados y antes de la cuenta regresiva. Los paneles temáticos oscuros conservan sus fondos interiores y contraste.

La galería ocupa el ancho del contenido. Al cargar una foto, sus dimensiones naturales determinan si el bloque es horizontal, vertical o cuadrado; la orientación se guarda por URL, de modo que no depende del orden. Las miniaturas llenan los bloques con `cover`; el visor muestra las fotos completas con `contain`.

El visor usa un diálogo modal nativo con foco contenido y restauración al cerrar, botones SVG centrados, navegación circular y teclas izquierda, derecha y Escape. La foto ampliada solo se monta cuando el visor está abierto. Se conserva la deduplicación de fotos y la visibilidad del editor.

`galleryThemes` asigna a cada diseño su paleta. Por petición del propietario, las galerías de todos los cumpleaños, incluido Espacio, muestran únicamente fotos, textos y controles: sin adornos perimetrales ni mascotas. Los recursos gráficos permanecen disponibles para los demás apartados.

Validación: `node --test tests/birthday-shared.test.cjs` cubre los nueve diseños, combinaciones de visibilidad y ubicación, reordenamiento, ausencia de decoraciones, orientación y controles del visor.
