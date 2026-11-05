"use client";
import { useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { weddingDesigns } from "@/lib/wedding-designs";
import { WeddingDesignPreview } from "@/components/invitation/WeddingDesignPreview";
import { InvitationExampleFrame } from "./InvitationExampleFrame";

type CatalogEvent = { slug: string; label: string; eventType: string; available: boolean };

export function DesignCatalog({ events }: { events: CatalogEvent[] }) {
  const [eventType, setEventType] = useState("wedding");
  const event = events.find((item) => item.eventType === eventType)!;
  const wedding = eventType === "wedding";
  const count = wedding ? weddingDesigns.length : 1;

  return <>
    <div className="catalog-toolbar">
      <div className="catalog-filter-block">
        <div className="hero-example-selector catalog-filters" role="group" aria-label="Filtrar diseños por tipo de evento">
          {events.map((item) => <button
            key={item.eventType}
            type="button"
            disabled={!item.available}
            title={!item.available ? `${item.label} · Próximamente` : undefined}
            aria-label={!item.available ? `${item.label} · Próximamente` : undefined}
            aria-pressed={eventType === item.eventType}
            aria-controls="home-design-catalog"
            onClick={() => setEventType(item.eventType)}
          >{item.label}</button>)}
        </div>
      </div>
      <p className="catalog-count" role="status" aria-live="polite">{wedding ? `${count} estilos para tu boda` : `1 ejemplo de ${event.label.toLocaleLowerCase("es")}`}</p>
    </div>

    <div className="home-design-catalog" id="home-design-catalog" aria-label={`Invitaciones: ${event.label}`}>
      {wedding ? weddingDesigns.map((design) => {
        const href = `/ejemplo-invitacion/boda-${design.kind}`;
        return <article className="catalog-option" key={design.id}>
          <a className="catalog-card" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Ver invitación completa: ${design.label}`}>
            <WeddingDesignPreview design={design} />
            <span className="catalog-caption"><strong>{design.label}</strong><span className="catalog-open-icon"><FiArrowUpRight aria-hidden="true" /></span></span>
          </a>
        </article>;
      }) : <article className="catalog-option" key={event.slug}>
        <div className="catalog-card catalog-event-card">
          <div className="catalog-event-preview" inert aria-hidden="true"><InvitationExampleFrame styleSlug={event.slug} label={event.label} viewportHeight={520} /></div>
          <a className="catalog-caption" href={`/ejemplo-invitacion/${event.slug}`} target="_blank" rel="noopener noreferrer"><strong>{event.label}</strong><span className="catalog-open-icon"><FiArrowUpRight aria-hidden="true" /></span></a>
        </div>
      </article>}
    </div>
    <p className="catalog-note">Personaliza los datos, las fotos y los colores para tu celebración.</p>
  </>;
}
