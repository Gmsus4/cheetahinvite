import { landingEventExamples } from "@/lib/landing-invitation-example";
import { DesignCatalog } from "./DesignCatalog";

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
          colores y la apariencia de tu invitación.
        </p>
      </div>

      <DesignCatalog events={landingEventExamples.map(({ slug, label, invitation, available }) => ({
        slug, label, eventType: invitation.eventType, available,
      }))} />
    </section>
  );
}
