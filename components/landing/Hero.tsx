import {
  FiArrowUpRight,
  FiChevronDown,
  FiStar,
} from "react-icons/fi";
import { HeroInvitationExamples } from "./HeroInvitationExamples";
import { HeroInvitationPhone } from "./HeroInvitationPhone";
import { Suspense } from "react";
import { getShowcaseExamples } from "@/lib/showcase";
import { LandingAnalytics } from "./LandingAnalytics";

async function HeroExamples() {
  const examples = await getShowcaseExamples("hero");
  return <HeroInvitationExamples examples={examples.map(({ slug, label, typeLabel, invitation, available }) => ({ slug, label, typeLabel, eventType: invitation.eventType, available }))} />;
}

export function Hero() {
  return (
    <section className="hero" id="inicio">
      <LandingAnalytics />
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
          <a className="text-link" href="#como-funciona">
            Cómo funciona <span><FiChevronDown aria-hidden="true" /></span>
          </a>
        </div>
      </div>

      <div className="hero-art hero-product-stage" id="ejemplos" aria-label="Ejemplo de una invitación creada con el editor">
        <div className="art-sun sun-one" aria-hidden="true" />
        <Suspense fallback={<HeroInvitationPhone loading />}><HeroExamples /></Suspense>
        <div className="art-spark spark-one"><FiStar aria-hidden="true" /></div>
        <div className="art-spark spark-two"><FiStar aria-hidden="true" /></div>
      </div>

    </section>
  );
}
