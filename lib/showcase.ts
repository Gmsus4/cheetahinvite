import "server-only";
import { isInvitationCoverLayout } from "./invitation-cover-layout";
import { connection } from "next/server";
import { prisma } from "@/prisma";
import type { Event } from "@/generated/prisma/client";
import { isInvitationPanelStyle, isInvitationSectionCorners, type InvitationProps, type InviteSection } from "./invitation-editor";
import { getInvitationEventContent } from "./invitation-event-content";
import { landingEventExamples } from "./landing-invitation-example";
import { exampleWithImages } from "./invitation-example-images";
import { heroPreviewImages } from "./hero-preview-images";

export function showcasePreview(content: InvitationProps): InvitationProps {
  const image = (url: string) => {
    if (heroPreviewImages[url]) return heroPreviewImages[url];
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "res.cloudinary.com") {
        parsed.pathname = parsed.pathname.replace(/\/image\/upload\/(?=v\d+\/)/, "/image/upload/c_limit,w_640,q_auto,f_auto/");
        return parsed.toString();
      }
    } catch { /* Relative local photos use the generated preview map above. */ }
    return url;
  };
  return { ...content, imageUrl: image(content.imageUrl), backgroundImageUrl: image(content.backgroundImageUrl || ""), sections: content.sections.map(section => ({ ...section, imageUrl: image(section.imageUrl), imageUrls: section.imageUrls?.map(image) })) };
}

export function showcaseContent(event: Event): InvitationProps {
  return {
    coverLayout: isInvitationCoverLayout(event.coverLayout) ? event.coverLayout : "split",
    name: event.name, eventType: event.eventType, hostNames: event.hostNames || "",
    date: event.eventDate ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(event.eventDate) : "Fecha por definir",
    eventDateKey: event.eventDate?.toISOString().slice(0, 10) || "", eventTime: event.eventTime || "",
    venue: event.venue || "", address: event.address || "", message: event.message || "",
    imageUrl: event.imageUrl || "", backgroundImageUrl: event.backgroundImageUrl || "", backgroundBlurIntensity: event.backgroundBlurIntensity, backgroundDimIntensity: event.backgroundDimIntensity,
    accent: event.accent, typography: event.typography, bodyTypography: event.bodyTypography,
    panelStyle: isInvitationPanelStyle(event.panelStyle) ? event.panelStyle : "auto", blurIntensity: event.blurIntensity, glassBorder: event.glassBorder,
    showSectionIcons: event.showSectionIcons, sectionCorners: isInvitationSectionCorners(event.sectionCorners) ? event.sectionCorners : "rounded",
    sections: Array.isArray(event.sections) ? event.sections as InviteSection[] : [],
  };
}

export async function getShowcaseExamples(placement: "hero" | "catalog") {
  await connection();
  const settings = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  if (!settings?.useCustomExamples) return landingEventExamples;
  const examples = await prisma.showcaseExample.findMany({ where: { publishedAt: { not: null }, ...(placement === "hero" ? { showInHero: true } : { showInCatalog: true }) }, orderBy: [{ position: "asc" }, { createdAt: "asc" }], take: 100 });
  return examples.map(example => {
    const invitation = example.publishedContent as unknown as InvitationProps;
    return { slug: example.slug, label: example.label, typeLabel: getInvitationEventContent(invitation.eventType).label, available: true, invitation };
  });
}

export async function getShowcaseInvitation(slug: string) {
  await connection();
  const example = await prisma.showcaseExample.findUnique({ where: { slug } });
  if (example?.publishedAt && example.publishedContent) return example.publishedContent as unknown as InvitationProps;
  const settings = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  if (settings?.useCustomExamples) return null;
  const legacy = landingEventExamples.find(example => example.slug === slug);
  return legacy ? exampleWithImages(legacy) : null;
}
