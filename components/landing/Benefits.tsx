import { FiArrowUpRight, FiCalendar, FiCheck, FiDownload, FiMapPin, FiSliders } from "react-icons/fi";

export function Benefits() {
  return <section className="home-benefits" aria-labelledby="benefits-title">
    <div className="benefits-heading"><span className="eyebrow">BONITA POR FUERA. PRÁCTICA POR DENTRO.</span><h2 id="benefits-title">Tú celebra.<br /><em>Tu invitación se encarga.</em></h2><p>Los detalles de tu evento y las respuestas de tus invitados, en un solo lugar.</p></div>
    <div className="benefits-grid">
      <article className="benefit-card benefit-rsvp">
        <div className="benefit-art rsvp-art" aria-hidden="true"><div className="rsvp-example"><span className="rsvp-avatar">AM</span><span><b>Ana Martínez</b><small>¡Ahí estaré para celebrar!</small></span><span className="confirmed"><FiCheck /> Confirmado</span></div><div className="rsvp-example"><span className="rsvp-avatar">DL</span><span><b>Diego López</b><small>Nos vemos en tu gran día.</small></span><span className="confirmed"><FiCheck /> Confirmado</span></div><span className="example-label">Vista ilustrativa · datos de ejemplo</span></div>
        <span className="feature-kicker">CONFIRMACIÓN DE ASISTENCIA</span><h3>Menos mensajes.<br />Más «sí, ahí estaré».</h3><p>Recibe respuestas en tu invitación, define cuántos acompañantes pueden confirmar y consulta los totales en tu panel.</p>
      </article>
      <article className="benefit-card"><div className="benefit-art details-art" aria-hidden="true"><span><FiCalendar /> La fecha</span><span><FiMapPin /> El lugar</span><span><FiCheck /> Todos los detalles</span></div><span className="feature-kicker">TODO A LA MANO</span><h3>Un enlace.<br />Todo tu gran día.</h3><p>Comparte fecha, ubicación y programa. Si cambia algún detalle, actualiza la invitación y conserva el mismo enlace.</p></article>
      <article className="benefit-card"><div className="benefit-art palette-art" aria-hidden="true"><FiSliders /><span /><span /><span /><b>Aa</b></div><h3>Tu historia, tu estilo.</h3><p>Personaliza fotos, colores y tipografías. Incluye solo las secciones que necesites: historia, regalos, galería y más.</p></article>
      <article className="benefit-card benefit-export"><div className="benefit-art export-art" aria-hidden="true"><FiDownload /><span>Tus confirmaciones<b>Listas para descargar</b></span><FiCheck /></div><h3>Organiza con más calma.</h3><p>Descarga las respuestas en un archivo compatible con Excel, con nombres, asistencia y número de acompañantes.</p><a className="text-link" href="#precios">Todo lo que incluye <FiArrowUpRight aria-hidden="true" /></a></article>
    </div>
  </section>;
}
