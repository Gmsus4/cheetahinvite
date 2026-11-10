import type { DriveStep } from "driver.js";

export function invitationEditorTourSteps({ published, example, returnsToCreation, returnsToDashboard = false, allIncluded }: { published: boolean; example: boolean; returnsToCreation: boolean; returnsToDashboard?: boolean; allIncluded: boolean }): DriveStep[] {
  const step = (element: string, title: string, description: string): DriveStep => ({
    element, popover: { title, description, side: "left", align: "center" },
  });
  return [
    step('.wa-cover-heading', 'Cada bloque cuenta una parte de tu celebración', 'Tu invitación está formada por bloques, como la portada, el lugar o los regalos. Cada bloque tiene sus propios botones para editar su información y apariencia. En computadora aparecen al pasar sobre él; en celular están visibles. Ahora te mostramos qué hace cada uno.'),
    step('[data-tour="block-edit"]', 'El lápiz: edita la información', 'Este lápiz abre la edición del texto y los datos del bloque. En computadora aparece al pasar sobre el bloque; en celular sus botones están visibles.'),
    step('[data-tour="block-style"]', 'Las capas: cambia el estilo del bloque', 'El icono de capas permite cambiar el fondo y el acabado de este bloque. Si está desactivado, ve a Apariencia y elige «Automático» para personalizar cada bloque por separado.'),
    step('[data-tour="block-alignment"]', 'Las líneas: alinea el texto', 'Usa estas líneas para colocar el texto a la izquierda, al centro o a la derecha. El ajuste se aplica solamente a este bloque.'),
    step('[data-tour="block-visibility"]', 'El ojo: oculta un bloque', 'Este ojo permite desactivar el bloque para que no aparezca en tu invitación. Conservaremos su contenido y sus fotos. Puedes volver a incluirlo desde el botón +.'),
    step('[data-invitation-field="cover-photo"] .wa-edit-button', 'El icono de imagen: agrega fotos', 'Este icono permite agregar o reemplazar la foto de portada. También lo encontrarás en los bloques para añadir sus propias fotos. Puedes ajustar cómo se muestran las fotos en celular y computadora.'),
    step('[data-tour="location"]', 'El marcador: fecha y lugar', 'Este marcador abre la fecha, la hora, el lugar del evento y su dirección. También puedes agregar el enlace de Google Maps para que tus invitados sepan cómo llegar.'),
    step('[data-tour="background"]', 'Elige el fondo', 'Aquí puedes poner una foto detrás de los bloques y ajustar su desenfoque y oscuridad para que el texto se lea bien.'),
    step('[data-tour="appearance"]', 'Dale tu estilo', 'Cambia los colores, las letras, las esquinas y el acabado de los bloques. Verás el resultado sobre tu invitación.'),
    step('[data-tour="add"]', 'Agrega lo que necesites', allIncluded ? 'Ya incluiste todos los bloques disponibles. Si desactivas alguno, podrás recuperarlo desde este botón.' : 'Usa el botón + para agregar una galería, playlist u otro bloque. Tú decides cuáles incluir.'),
    step('[data-tour="save"]', published ? 'Publica tus cambios' : 'Guarda tu diseño', published ? 'El botón «Publicar cambios» actualiza lo que ven tus invitados. Hazlo cuando estés conforme con tus ajustes.' : example ? 'Pulsa «Guardar diseño» para conservar los cambios. La publicación del ejemplo se realiza desde Administración.' : 'Pulsa «Guardar borrador» para conservar los cambios. Guardar todavía no publica tu invitación ni inicia un pago.'),
    step('[data-tour="help"]', '¿Necesitas ver la guía otra vez?', 'El signo de interrogación es tu botón de Ayuda. Tócalo cuando quieras repetir este recorrido, aunque ya lo hayas terminado o cerrado.'),
    step('[data-tour="back"]', returnsToDashboard ? 'Vuelve al dashboard' : returnsToCreation ? 'Vuelve para revisar y publicar' : 'Regresa al editor', returnsToDashboard ? 'Guarda tus cambios y usa esta flecha para cerrar la pestaña de diseño y volver al dashboard, donde están tus invitaciones.' : returnsToCreation ? 'Cuando termines, guarda tus cambios y usa esta flecha para cerrar esta pestaña y volver al asistente de tu invitación. Allí pulsa «Revisar y publicar» para ver la información y continuar al pago.' : 'Esta flecha te devuelve al editor completo. Si tienes cambios pendientes, te avisaremos antes de salir.'),
  ];
}
