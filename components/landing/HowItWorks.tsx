import { FiArrowUpRight, FiCalendar, FiEdit3, FiSend } from "react-icons/fi";

const steps = [
  {
    number: "01",
    title: "Crea tu evento",
    description: "Agrega el nombre, la fecha, el lugar y los demás datos de tu celebración.",
    symbol: FiCalendar,
  },
  {
    number: "02",
    title: "Dale tu estilo",
    description: "Incorpora tus fotos y elige colores, tipografía y decoraciones.",
    symbol: FiEdit3,
  },
  {
    number: "03",
    title: "Comparte tu invitación",
    description: "Publica tu invitación y envía el enlace a tus invitados.",
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
            Todo lo que necesitas para invitar, organizar y celebrar, en un solo
            lugar.
          </p>
          <a className="how-details-link" href="#precios">
            Ver qué incluye <FiArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="steps">
        {steps.map((step) => (
          <article key={step.number}>
            <span className="step-no">{step.number}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
            <span className="step-symbol"><step.symbol aria-hidden="true" /></span>
          </article>
        ))}
      </div>
    </section>
  );
}
