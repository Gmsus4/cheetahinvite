import { FiArrowUpRight, FiCalendar, FiCheck } from "react-icons/fi";
import { INVITATION_PRICE, invitationPriceLabel } from "@/lib/invitation-payment";

const features = [
  "Invitación personalizable",
  "Enlace público para compartir",
  "Fotos, colores y tipografías",
  "Confirmación de asistencia opcional",
  "Lista de respuestas y descarga para Excel",
  "Edición durante la vigencia",
];

export function Pricing() {
  return (
    <section className="pricing-section" id="precios" aria-labelledby="home-pricing-title">
      <div className="pricing-copy">
        <span className="eyebrow">UN PLAN, MUCHOS RECUERDOS</span>
        <h2 id="home-pricing-title">
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
        <div className="price-purchase">
          <div className="price-overview">
            <span className="price-label">INVITACIÓN DIGITAL</span>
            <div className="price">{invitationPriceLabel} <span>MXN</span></div>
            <p>IVA incluido · Un pago por evento</p>
            <span className="price-duration"><FiCalendar aria-hidden="true" /> {INVITATION_PRICE.months} meses activa</span>
          </div>
          <div className="price-action">
            <a className="button" href="/crear">
              Crear mi invitación <FiArrowUpRight aria-hidden="true" />
            </a>
            <small className="price-footnote">
              Crea y previsualiza gratis.<br />Paga solo al publicar.
            </small>
          </div>
        </div>
        <div className="price-includes">
          <span className="eyebrow">TODO INCLUIDO</span>
          <h3>Lo especial está en los detalles.</h3>
          <ul>
            {features.map((feature) => (
              <li key={feature}>
                <span><FiCheck aria-hidden="true" /></span> {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
