import {
  FiArrowUpRight,
  FiStar,
} from "react-icons/fi";
import { HeroInvitationExamples } from "./HeroInvitationExamples";
import { cacheLife } from "next/cache";
import { getShowcaseExamples } from "@/lib/showcase";
import { LandingAnalytics } from "./LandingAnalytics";
import { getCurrentPrice } from "@/lib/site-pricing";

export async function Hero() {
  "use cache";
  // Include the real categories and price in the prerendered shell. A phone-only
  // Suspense fallback removes the caption on reload and shifts the next section.
  // Admin changes already invalidate the homepage via revalidatePath("/").
  cacheLife("minutes");
  const [examples, price] = await Promise.all([getShowcaseExamples("hero"), getCurrentPrice()]);
  return (
    <section className="hero" id="inicio">
      <LandingAnalytics />
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> INVITACIONES DIGITALES PARA CELEBRAR
        </div>
        <h1>
          Hay días que
          <br />
          merecen <em>compartirse.</em>
        </h1>
        <p className="hero-lead">
          Tus fotos, los detalles de tu evento y la confirmación de asistencia,
          en un solo enlace. Crea y revisa tu invitación gratis; paga al publicarla.
        </p>
        <div className="hero-actions">
          <a className="button" href="/crear">
            Crear mi invitación gratis <span><FiArrowUpRight aria-hidden="true" /></span>
          </a>
          <a className="text-link" href="/demo">
            Ver ejemplos <span><FiArrowUpRight aria-hidden="true" /></span>
          </a>
        </div>
      </div>

      <div className="hero-art hero-product-stage" id="ejemplos" aria-label="Ejemplo de una invitación creada con el editor">
        <div className="art-sun sun-one" aria-hidden="true" />
        <HeroInvitationExamples priceLabel={price.label} examples={examples.map(({ slug, label, typeLabel, invitation, available }) => ({ slug, label, typeLabel, eventType: invitation.eventType, available }))} />
        <div className="art-spark spark-one"><FiStar aria-hidden="true" /></div>
        <div className="art-spark spark-two"><FiStar aria-hidden="true" /></div>
      </div>

    </section>
  );
}
