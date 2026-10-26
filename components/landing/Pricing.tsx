import { FiArrowUpRight, FiCheck } from "react-icons/fi";

const features = [
  "Invitación personalizable",
  "Enlace público para compartir",
  "Fotos, colores y tipografías",
  "Edición durante la vigencia",
];

export function Pricing() {
  return (
    <section className="pricing-section" id="precios">
      <div className="pricing-copy">
        <span className="eyebrow">UN PLAN, MUCHOS RECUERDOS</span>
        <h2>
          Tu evento merece
          <br />
          <em>un gran comienzo.</em>
        </h2>
        <p>
          Publica tu invitación con todo listo para compartir. Sin
          mensualidades, sin complicaciones.
        </p>
      </div>

      <div className="price-card">
        <div className="price-overview">
          <span className="price-label">INVITACIÓN DIGITAL</span>
          <div className="price price-pending">Un pago por evento</div>
          <p>Un pago por evento · 12 meses activa</p>
        </div>
        <ul>
          {features.map((feature) => (
            <li key={feature} className="flex flex-row">
              <span><FiCheck aria-hidden="true" /></span> {feature}
            </li>
          ))}
        </ul>
        <div className="price-action">
          <a className="button" href="/crear">
            Crear mi invitación <span><FiArrowUpRight aria-hidden="true" /></span>
          </a>
          <small className="price-footnote">
            Crea y previsualiza gratis. Consulta el total antes de pagar y publicar.
          </small>
        </div>
      </div>
    </section>
  );
}
