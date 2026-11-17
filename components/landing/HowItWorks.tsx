import { FiArrowUpRight, FiCalendar, FiEdit3, FiSend } from "react-icons/fi";

const steps = [
  {
    number: "01",
    title: "Crea tu evento",
    description: "Crea tu cuenta y agrega los protagonistas, la fecha y el lugar. Elige qué detalles incluir.",
    symbol: FiCalendar,
  },
  {
    number: "02",
    title: "Dale tu estilo",
    description: "Agrega tus fotos, ajusta colores y tipografías y revisa cómo se verá antes de pagar.",
    symbol: FiEdit3,
  },
  {
    number: "03",
    title: "Comparte tu invitación",
    description: "Elige acceso público o con PIN, paga para publicar y envía el enlace por WhatsApp o correo.",
    symbol: FiSend,
  },
];

export function HowItWorks() {
  return (
    <section className="how-section" id="como-funciona">
      <div className="how-intro">
        <span className="eyebrow">ASÍ DE FÁCIL</span>
        <h2>
          Menos pendientes.
          <br />
          <em>Más emoción.</em>
        </h2>
        <div className="how-summary">
          <p>
            De los primeros detalles al enlace que recibirán tus invitados.
            Tú decides cuándo está lista para publicar.
          </p>
          <a className="how-details-link" href="#precios">
            Ver qué incluye <FiArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="steps">
        {steps.map((step) => (
          <article key={step.number}>
            <div className={`step-illustration step-illustration-${step.number}`} aria-hidden="true">
              <span className="step-no">{step.number}</span>
              <div className="step-paper"><step.symbol /><span>{step.number === "01" ? "Tu gran día" : step.number === "02" ? "Muy a tu estilo" : "¡Estás invitado!"}</span><i /><i /></div>
            </div>
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
