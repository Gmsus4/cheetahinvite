import { FiArrowUpRight, FiCalendar, FiCheck } from "react-icons/fi";
import { cacheLife } from "next/cache";
import { getCurrentPrice } from "@/lib/site-pricing";

const features = [
  "Fotos, textos, colores y tipografías",
  "Secciones que eliges para tu evento",
  "Enlace público o protegido con PIN",
  "Confirmación de asistencia opcional",
  "Lista de respuestas y descarga para Excel",
  "Edición durante la vigencia",
];

export async function Pricing() {
  "use cache";
  cacheLife("minutes");
  const price = await getCurrentPrice();
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
          Un pago por la publicación de tu evento, con personalización y
          confirmaciones incluidas. Sin mensualidades ni renovación automática.
        </p>
      </div>

      <div className="price-card">
        <div className="price-purchase">
          <div className="price-overview">
            <span className="price-label">INVITACIÓN DIGITAL</span>
            <div className="price">{price.label} <span>MXN</span></div>
            <p>IVA incluido · Un pago por evento</p>
            <span className="price-duration"><FiCalendar aria-hidden="true" /> {price.months} meses desde el pago</span>
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
