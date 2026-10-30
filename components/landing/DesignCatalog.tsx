"use client";
import { birthdayCinemaTemplate } from '@/lib/birthday-cinema';
import { birthdayElegantTemplate } from '@/lib/birthday-elegant';
import { birthdayCowboyTemplate } from '@/lib/birthday-cowboy';
import { birthdayGamerTemplate } from '@/lib/birthday-gamer';


import { birthdayDinosaurTemplate } from '@/lib/birthday-dinosaur';

import { birthdaySpaceTemplate } from '@/lib/birthday-space';
import { useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { weddingDesigns } from "@/lib/wedding-designs";
import { WeddingDesignPreview } from "@/components/invitation/WeddingDesignPreview";
import { EventPreview } from "@/components/dashboard/EventDesignPicker";
import { birthdayConfettiTemplate } from "@/lib/birthday-designs";
import { birthdayPastelTemplate } from "@/lib/birthday-pastel";
import { birthdayNeonTemplate } from "@/lib/birthday-neon";
import { birthdayDiscoTemplate } from "@/lib/birthday-disco";
import { InvitationExampleFrame } from "./InvitationExampleFrame";

type CatalogEvent = { slug: string; label: string; eventType: string };

const birthdayDesigns = [
  { template: birthdayCinemaTemplate, slug: "cumpleanos-cine" },
  { template: birthdayElegantTemplate, slug: "cumpleanos-elegante" },
  { template: birthdayCowboyTemplate, slug: "cumpleanos-vaquero" },
  { template: birthdayGamerTemplate, slug: "cumpleanos-gamer" },
  { template: birthdayDinosaurTemplate, slug: "cumpleanos-dinosaurios" },
  { template: birthdayConfettiTemplate, slug: "cumpleanos-confeti" },
  { template: birthdayPastelTemplate, slug: "cumpleanos-globos-pastel" },
  { template: birthdayNeonTemplate, slug: "cumpleanos-neon" },
  { template: birthdayDiscoTemplate, slug: "cumpleanos-disco" },
  { template: birthdaySpaceTemplate, slug: "cumpleanos-espacial" },
].filter(({ template }) => template.available);

export function DesignCatalog({ events }: { events: CatalogEvent[] }) {
  const [eventType, setEventType] = useState("wedding");
  const event = events.find((item) => item.eventType === eventType)!;
  const wedding = eventType === "wedding";
  const birthday = eventType === "birthday";
  const count = wedding ? weddingDesigns.length : birthday ? birthdayDesigns.length : 1;

  return <>
    <div className="catalog-toolbar">
      <div className="hero-example-selector catalog-filters" role="group" aria-label="Filtrar diseños por tipo de evento">
        {events.map((item) => <button
          key={item.eventType}
          type="button"
          aria-pressed={eventType === item.eventType}
          aria-controls="home-design-catalog"
          onClick={() => setEventType(item.eventType)}
        >{item.label}</button>)}
      </div>
      <p className="catalog-count" role="status" aria-live="polite">{wedding ? `${count} diseños para tu boda` : birthday ? `${count} diseños para tu cumpleaños` : `1 ejemplo de ${event.label.toLocaleLowerCase("es")}`}</p>
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
      }) : birthday ? birthdayDesigns.map(({ template, slug }) => <article className="catalog-option" key={template.id}>
        <a className="catalog-card" href={`/ejemplo-invitacion/${slug}`} target="_blank" rel="noopener noreferrer" aria-label={`Ver invitación completa: ${template.label}`}>
          <EventPreview eventType="birthday" template={template} />
          <span className="catalog-caption"><strong>{template.label}</strong><span className="catalog-open-icon"><FiArrowUpRight aria-hidden="true" /></span></span>
        </a>
      </article>) : <article className="catalog-option" key={event.slug}>
        <div className="catalog-card catalog-event-card">
          <div className="catalog-event-preview" inert aria-hidden="true"><InvitationExampleFrame styleSlug={event.slug} label={event.label} viewportHeight={520} /></div>
          <a className="catalog-caption" href={`/ejemplo-invitacion/${event.slug}`} target="_blank" rel="noopener noreferrer"><strong>{event.label}</strong><span className="catalog-open-icon"><FiArrowUpRight aria-hidden="true" /></span></a>
        </div>
      </article>}
    </div>
    <p className="catalog-note">{wedding || birthday ? "Elige tu favorito. Después podrás personalizar sus colores, fotos y detalles." : "Un ejemplo para inspirarte. Personaliza los datos, las fotos y el estilo para tu celebración."}</p>
  </>;
}
