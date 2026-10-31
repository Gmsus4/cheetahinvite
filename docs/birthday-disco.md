# Disco

Cuarta identidad de cumpleaños: `birthday-disco-v1`. Disponible en el grid compartido y en `/ejemplo-invitacion/cumpleanos-disco`.

La composición usa plata, lila y tornasol; tipografía Outfit con nombre cromado, DM Sans para texto y Caveat para notas. La portada muestra la bola colgante, ambas estrellas y el collage suave. La bienvenida reúne las otras dos bolas de espejos y el perrito metálico. Una franja musical oscura incorpora el casco y un disco de vinilo construido con CSS. Así se utilizan los ocho recursos iniciales incluso con secciones opcionales desactivadas.

Recursos optimizados en `public/birthday/disco/`: `helmet`, `collage`, `ball-purple`, `hanging-ball`, `ball-navy`, `chrome-spark`, `balloon-dog`, `holo-star`, `silver-stars`, `pencil`, todos WebP. Los originales se conservan. Las imágenes claras se mezclan sobre los fondos suaves; el casco conserva su apariencia sobre la franja oscura.

Secciones y fondos de ancho completo, sin texturas repetidas ni márgenes externos que generen huecos. El contenido se centra con contenedores interiores. El collage de portada se desvanece sin cortar el texto.

Admite color principal, fotografía opcional, datos reales, mapa, programa, mensajes, vestimenta, regalos, música, galería, RSVP integrado o externo y cuenta regresiva. Los datos del ejemplo son ficticios. Seleccionar Disco conserva el contenido personal. El RSVP reutiliza `RsvpForm` con un tema claro lila.

Verificación: TypeScript, pruebas de catálogo, enlaces y persistencia del diseño; revisión visual en escritorio y a 390 px; sin desbordamiento, imágenes fallidas ni huecos entre bloques; confirmación probada en modo de demostración.

Se añadieron dos recursos para reducir repeticiones: `estrellas3discopng.png` → `silver-stars.webp` en vestimenta, y `lapizpng.png` → `pencil.webp` en confirmación. Sustituyen la estrella tornasol y el destello cromado que se repetían en esos bloques. El catálogo de recursos suma once imágenes; las dos nuevas aparecen cuando se activan sus secciones.

La bola con estrellas azules (`ball-navy.webp`) se reserva exclusivamente para la bienvenida. En el cierre la sustituyen las estrellas plateadas. Las demás secciones conservan ilustraciones asignadas según el contenido: destello cromado en galería, bola morada en historia, perrito en personas especiales, bola colgante en ceremonia/recepción y estrella tornasol en información adicional. No dejar vacíos los espacios al sustituir un recurso repetido.

`casco2png.png` se incorpora como `helmet-silver.webp` en la sección opcional de música, sustituyendo el casco dorado repetido. El casco dorado permanece en la franja musical inicial. Se conservan once recursos en total.

La alternancia dinámica de fondos, la galería bento sin adornos y el visor siguen [el comportamiento compartido de cumpleaños](birthday-shared.md).
