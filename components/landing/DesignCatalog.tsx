import { FiArrowUpRight } from "react-icons/fi";
import { InvitationExampleFrame } from "./InvitationExampleFrame";

type CatalogEvent = { slug: string; label: string; typeLabel: string; eventType: string; available: boolean };

export function DesignCatalog({ events }: { events: CatalogEvent[] }) {

  return <>
    <div className="home-design-catalog" id="home-design-catalog" aria-label="Ejemplos de invitaciones por tipo de evento">
      {events.map(example => <article className="catalog-option" key={example.slug}>
        <div className="catalog-card catalog-event-card">
          <div className="catalog-event-preview" inert aria-hidden="true"><InvitationExampleFrame styleSlug={example.slug} label={example.label} viewportHeight={520} /></div>
          <a className="catalog-caption" href={`/ejemplo-invitacion/${example.slug}`} target="_blank" rel="noopener noreferrer"><strong>{events.filter(item => item.eventType === example.eventType).length > 1 ? example.label : example.typeLabel}</strong><span className="catalog-open-icon"><FiArrowUpRight aria-hidden="true" /></span></a>
        </div>
      </article>)}
    </div>
    <p className="catalog-note">Personaliza los datos, las fotos y los colores para tu celebración.</p>
  </>;
}
