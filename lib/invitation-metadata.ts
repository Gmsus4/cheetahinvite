import type { Metadata } from "next";
import { invitationPath } from "@/lib/invitation-url";

type ShareableEvent = {
  ownerId: string;
  slug: string | null;
  customSlug: string | null;
  name: string;
  message: string | null;
  eventDate: Date | null;
  venue: string | null;
  imageUrl: string | null;
};

export function invitationMetadata(event: ShareableEvent, origin: string): Metadata {
  const metadataBase = new URL(origin);
  const title = `${event.name} | Cheetah Invite`;
  const details = [
    event.eventDate && new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(event.eventDate),
    event.venue,
  ].filter(Boolean).join(" · ");
  const description = (event.message?.trim() || `Estás invitado a celebrar un momento especial.${details ? ` ${details}.` : ""}`)
    .replace(/\s+/g, " ").slice(0, 200);
  const image = new URL(event.imageUrl || "/Logo.webp", metadataBase).toString();
  const url = new URL(invitationPath(event)!, metadataBase).toString();

  return {
    metadataBase,
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "es_MX",
      siteName: "Cheetah Invite",
      url,
      title,
      description,
      images: [{ url: image, alt: `Portada de ${event.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image, alt: `Portada de ${event.name}` }],
    },
  };
}
