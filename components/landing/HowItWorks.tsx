import { FiArrowUpRight, FiEdit3, FiGrid, FiSend } from "react-icons/fi";

const steps = [
  {
    number: "01",
    title: "Elige tu diseño",
    description: "Encuentra una plantilla que vaya con tu celebración y hazla tuya.",
    symbol: FiGrid,
  },
  {
    number: "02",
    title: "Personaliza cada detalle",
    description: "Agrega la información, tus fotos y ese toque que solo tú puedes darle.",
    symbol: FiEdit3,
  },
  {
    number: "03",
    title: "Comparte y celebra",
    description: "Envía un solo enlace y recibe las confirmaciones de tus invitados.",
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
        <p>
          Todo lo que necesitas para invitar, organizar y celebrar, en un solo
          lugar.
        </p>
        <a className="button button-light" href="/crear">
          Empieza a crear <span><FiArrowUpRight aria-hidden="true" /></span>
        </a>
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
