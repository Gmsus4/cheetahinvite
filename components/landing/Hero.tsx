import {
  FiArrowUpRight,
  FiChevronDown,
  FiEdit3,
  FiStar,
} from "react-icons/fi";
import { HeroInvitationExamples } from "./HeroInvitationExamples";
import { landingEventExamples } from "@/lib/landing-invitation-example";
import { weddingDesigns } from "@/lib/wedding-designs";

export function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> TUS MOMENTOS, EN UN SOLO LUGAR
        </div>
        <h1>
          Hay días que
          <br />
          merecen <em>compartirse.</em>
        </h1>
        <p className="hero-lead">
          Crea una invitación digital tan especial como tu celebración.
          Personalízala y comparte los detalles de tu celebración en un solo lugar.
        </p>
        <div className="hero-actions">
          <a className="button" href="/crear">
            Crea tu invitación <span><FiArrowUpRight aria-hidden="true" /></span>
          </a>
          <a className="text-link" href="#personalizacion">
            Explorar estilos <span><FiChevronDown aria-hidden="true" /></span>
          </a>
        </div>
      </div>

      <div className="hero-art hero-product-stage" aria-label="Ejemplo de una invitación creada con el editor">
        <div className="art-sun sun-one" aria-hidden="true" />
        <div className="floating-note note-top">
          <span><FiStar aria-hidden="true" /></span> Tu historia, tu estilo
        </div>
        <HeroInvitationExamples
          examples={landingEventExamples.map(({ slug, label, available }) => ({ slug, label, available }))}
          weddingDesigns={weddingDesigns.map(({ kind, label }) => ({ slug: `boda-${kind}`, label }))}
          birthdayDesigns={[]}
        />
        <div className="floating-note note-bottom">
          <span className="note-check"><FiEdit3 aria-hidden="true" /></span>
          <span>
            <b>A tu estilo</b>
            <small>Datos, fotos y decoración</small>
          </span>
        </div>
        <div className="art-spark spark-one"><FiStar aria-hidden="true" /></div>
        <div className="art-spark spark-two"><FiStar aria-hidden="true" /></div>
      </div>

    </section>
  );
}
