# Confeti · Animalitos de fiesta

Primera identidad de cumpleaños: `birthday-confetti-v1`. Se elige desde el grid compartido de diseños del asistente de cumpleaños. La composición se comparte entre vista previa, vista privada y página pública mediante `InvitationCanvas`.

Ejemplo sin iniciar sesión: `/ejemplo-invitacion/cumpleanos-confeti`. Los nombres, lugares y horarios del ejemplo son ficticios; no se aplican a las invitaciones del usuario.

Las nueve imágenes originales y doce recursos adicionales están optimizados como WebP en `public/birthday/confetti/`, conservando transparencia, proporciones y originales. La portada conserva el osito y la bienvenida mantiene elefante y erizo; se reutilizan algodón y papel de `public/textures/wedding/`.

Los recursos nuevos se asignan por apartado: oso pintor en historia, pato con pastel en ceremonia, globo aerostático en otra sede, foca en programa, oso con pajarito en personas especiales, tortuga en vestimenta, pingüino con globos en confirmación, tiburón en música y pingüino pequeño en información adicional. Regalos conserva el dinosaurio con regalo. El cierre usa el oso con globos; la nube acompaña la cuenta regresiva. El marco queda disponible en la colección; la galería no lleva decoraciones. Las asignaciones permanecen estables al ocultar o reordenar apartados, sin modificar colores, tipografía ni composición.

El diseño admite nombre, fecha, hora, lugar, dirección, mensaje, foto opcional, color principal y secciones del editor. Conserva el orden y visibilidad de las secciones. Incluye galería, enlaces validados, mapa y RSVP integrado o externo. El ejemplo del formulario no envía respuestas; una invitación publicada utiliza el identificador del evento.

La cuenta regresiva reutiliza el componente existente, extraído a `components/invitation/CountdownTimer.tsx`, conservando su zona horaria de México (UTC−6).

La alternancia dinámica de fondos, la galería bento sin adornos y el visor siguen [el comportamiento compartido de cumpleaños](birthday-shared.md).
