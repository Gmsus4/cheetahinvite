# Recursos para las plantillas

Cada tipo de evento tiene `plantilla1`, `plantilla2` y `plantilla3`.
Las carpetas son: `boda`, `cumpleanos`, `graduacion`, `baby-shower` y `aniversario`.

Dentro de cada plantilla usa estos nombres (las mayúsculas no importan):

También se aceptan espacios o guiones: `Superior izquierdo.png`,
`Superior_izquierdo.png` y `superior-izquierdo.png` corresponden a la misma esquina.
Conserva un solo archivo por adorno para evitar ambigüedades.

| Archivo | Uso |
| --- | --- |
| Superior_izquierdo.png | Esquina superior izquierda |
| Superior_derecho.png | Esquina superior derecha |
| Inferior_izquierdo.png | Esquina inferior izquierda |
| Inferior_derecho.png | Esquina inferior derecha |
| separador.png | Adorno entre secciones |
| flor.png | Adorno pequeño de bienvenida |
| decorate.png | Decoración adicional |

Además de PNG, se admiten WebP, SVG, AVIF, JPG y JPEG. Preferir imágenes con
transparencia y adornos de la misma colección. Los recursos ausentes se omiten;
una plantilla sin imágenes aparece deshabilitada, con “Imágenes pendientes”.

Opcionalmente añade `plantilla.json` con el color principal recomendado:

```json
{ "name": "Jardín de azafrán", "primaryColor": "#77518A" }
```

Ese color se aplica al seleccionar la plantilla; después se puede personalizar
desde “Color principal” en el editor. Plantilla 1 de boda usa morado.

`name` define el nombre visible en el editor. Las carpetas conservan sus nombres
`plantilla1`, `plantilla2` y `plantilla3` aunque cambie el nombre mostrado.

Conserva en cada carpeta el origen y la licencia de tus recursos.

Después de agregar o sustituir imágenes ejecuta:

```sh
npm run templates:sync
```

También se sincronizan al iniciar `npm run dev` y al compilar `npm run build`.
El proceso conserva los originales, copia los recursos a `public/plantillas`
y actualiza el catálogo `lib/generated-invitation-templates.ts`.

En el editor selecciona la tarjeta y guarda. “Sin plantilla” retira la decoración.
La selección no modifica textos, fotos, orden de bloques, colores o fuentes.
