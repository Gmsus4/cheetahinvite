import { FiArrowUpRight } from "react-icons/fi";
import { landingInvitationStyles } from "@/lib/landing-invitation-example";
import { InvitationExampleFrame } from "./InvitationExampleFrame";

export function TemplateGallery() {
  return (
    <section className="templates-section" id="personalizacion">
      <div className="section-heading">
        <div>
          <span className="eyebrow">LOS DETALLES HACEN LA DIFERENCIA</span>
          <h2>
            Una invitación
            <br />
            que se siente <em>muy tuya.</em>
          </h2>
        </div>
        <p>
          Tus datos, tus fotos y los detalles que van contigo. Personaliza los
          colores, las letras y las decoraciones de tu invitación.
        </p>
      </div>

      <p className="personalization-note">La misma invitación, con diferentes decoraciones disponibles en el editor.</p>
      <div className="personalization-grid">
        {landingInvitationStyles.map(({ slug, template }) => (
          <article className="personalization-example" key={slug}>
            <div className="personalization-example-preview">
              <InvitationExampleFrame styleSlug={slug} label={template.label} decorationOnly />
            </div>
            <div className="personalization-example-meta">
              <h3>{template.label}</h3>
              <span>Decoración para boda</span>
            </div>
          </article>
        ))}
      </div>

      <div className="center-link">
        <a className="text-link" href="#como-funciona">
          Conoce cómo funciona <span><FiArrowUpRight aria-hidden="true" /></span>
        </a>
      </div>
    </section>
  );
}
