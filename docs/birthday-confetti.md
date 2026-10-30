# Confeti · Animalitos de fiesta

Primera identidad de cumpleaños: `birthday-confetti-v1`. Se elige desde el grid compartido de diseños del asistente de cumpleaños. La composición se comparte entre vista previa, vista privada y página pública mediante `InvitationCanvas`.

Ejemplo sin iniciar sesión: `/ejemplo-invitacion/cumpleanos-confeti`. Los nombres, lugares y horarios del ejemplo son ficticios; no se aplican a las invitaciones del usuario.

Las nueve imágenes proporcionadas están optimizadas como WebP en `public/birthday/confetti/`, sin modificar los originales. La portada utiliza el osito; las secciones distribuyen dinosaurios, elefante, erizo y tigre. Los globos realistas quedan disponibles como recurso de la colección. Se reutilizan algodón y papel de `public/textures/wedding/`.

El diseño admite nombre, fecha, hora, lugar, dirección, mensaje, foto opcional, color principal y secciones del editor. Conserva el orden y visibilidad de las secciones. Incluye galería, enlaces validados, mapa y RSVP integrado o externo. El ejemplo del formulario no envía respuestas; una invitación publicada utiliza el identificador del evento.

La cuenta regresiva reutiliza el componente existente, extraído a `components/invitation/CountdownTimer.tsx`, conservando su zona horaria de México (UTC−6).
