import { FiArrowUpRight, FiHeart } from "react-icons/fi";

export function ClosingCta() {
  return (
    <section className="closing-cta">
      <div className="closing-flower"><FiHeart aria-hidden="true" /></div>
      <div className="closing-copy">
        <span className="eyebrow">EL PRIMER PASO ES TUYO</span>
        <h2>
          Tu próxima gran historia
          <br />
          empieza con una <em>invitación.</em>
        </h2>
      </div>
      <div className="closing-action"><a className="button" href="/crear">Crea tu invitación <FiArrowUpRight aria-hidden="true" /></a><p>Personaliza y previsualiza gratis.</p></div>
    </section>
  );
}
