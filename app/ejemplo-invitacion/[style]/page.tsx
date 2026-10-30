import { birthdayCinemaExample } from '@/lib/birthday-cinema';
import { birthdayElegantExample } from '@/lib/birthday-elegant';
import { birthdayCowboyExample } from '@/lib/birthday-cowboy';
import { birthdayGamerExample } from '@/lib/birthday-gamer';
import { birthdayDinosaurExample } from '@/lib/birthday-dinosaur';
import { birthdaySpaceExample } from '@/lib/birthday-space';
import { birthdayDiscoExample } from "@/lib/birthday-disco";
import { birthdayNeonExample } from "@/lib/birthday-neon";
import { birthdayPastelExample } from "@/lib/birthday-pastel";
import { birthdayConfettiExample } from "@/lib/birthday-designs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { InvitationCanvas } from "@/components/dashboard/EventEditor";
import { landingEventExamples, landingInvitationExample, landingInvitationStyles } from "@/lib/landing-invitation-example";
import "./example.css";
import { WeddingInvitation } from "@/components/invitation/WeddingInvitation";
import { weddingDesignExamples, weddingExample } from "@/lib/wedding-design-examples";

export const metadata: Metadata = {
  title: "Invitación de ejemplo | Cheetah Invite",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return [{ slug: "cumpleanos-cine" }, { slug: "cumpleanos-elegante" }, { slug: "cumpleanos-vaquero" }, { slug: "cumpleanos-gamer" }, { slug: "cumpleanos-dinosaurios" }, { slug: "cumpleanos-espacial" }, { slug: "cumpleanos-disco" }, { slug: "cumpleanos-neon" }, { slug: "cumpleanos-globos-pastel" }, { slug: "cumpleanos-confeti" }, ...landingInvitationStyles, ...landingEventExamples, ...weddingDesignExamples].map(({ slug }) => ({ style: slug }));
}

type ExampleProps = {
  params: Promise<{ style: string }>;
  searchParams: Promise<{ vista?: string | string[]; paleta?: string | string[]; foto?: string | string[]; nombres?: string | string[] }>;
};

export default function InvitationExamplePage(props: ExampleProps) {
  return <Suspense fallback={<p role="status">Preparando invitación de ejemplo…</p>}>
    <InvitationExampleData {...props} />
  </Suspense>;
}

async function InvitationExampleData({ params, searchParams }: ExampleProps) {
  const [{ style }, query] = await Promise.all([params, searchParams]);
  if (style === "cumpleanos-cine") return <main className="public-invitation-page invitation-example-page"><InvitationCanvas {...birthdayCinemaExample} /></main>;
  if (style === "cumpleanos-elegante") return <main className="public-invitation-page invitation-example-page"><InvitationCanvas {...birthdayElegantExample} /></main>;
  if (style === "cumpleanos-vaquero") return <main className="public-invitation-page invitation-example-page"><InvitationCanvas {...birthdayCowboyExample} /></main>;
  if (style === "cumpleanos-gamer") return <main className="public-invitation-page invitation-example-page"><InvitationCanvas {...birthdayGamerExample} /></main>;
  if (style === "cumpleanos-dinosaurios") return <main className="public-invitation-page invitation-example-page"><InvitationCanvas {...birthdayDinosaurExample} /></main>;
  if (style === "cumpleanos-espacial") return <main className="public-invitation-page invitation-example-page"><InvitationCanvas {...birthdaySpaceExample} /></main>;
  if (style === "cumpleanos-disco") return <main className="public-invitation-page invitation-example-page"><InvitationCanvas {...birthdayDiscoExample} /></main>;
  if (style === "cumpleanos-neon") return <main className="public-invitation-page invitation-example-page"><InvitationCanvas {...birthdayNeonExample} /></main>;
  if (style === "cumpleanos-globos-pastel") return <main className="public-invitation-page invitation-example-page"><InvitationCanvas {...birthdayPastelExample} /></main>;
  if (style === "cumpleanos-confeti") return <main className="public-invitation-page invitation-example-page"><InvitationCanvas {...birthdayConfettiExample} /></main>;
  const wedding = weddingDesignExamples.find(({ slug }) => slug === style);
  if (wedding) {
    const requestedPalette = typeof query.paleta === "string" ? query.paleta.toLowerCase() : "";
    const palette = wedding.design.palettes.find(p => p.accent.slice(1).toLowerCase() === requestedPalette) ?? wedding.design.palettes[0];
    const names = typeof query.nombres === "string" ? query.nombres.slice(0, 100) : "";
    return <main className="public-invitation-page invitation-example-page"><WeddingInvitation {...weddingExample} templateId={wedding.design.id} accent={palette.accent} imageUrl={query.foto === "no" ? "" : weddingExample.imageUrl} hostNames={names || weddingExample.hostNames} /></main>;
  }
  const example = landingInvitationStyles.find(({ slug }) => slug === style);
  const eventExample = landingEventExamples.find(({ slug }) => slug === style);
  if (!example && !eventExample) notFound();

  const invitation = eventExample?.invitation ?? {
    ...landingInvitationExample,
    templateId: example!.template.id,
    accent: example!.template.accent ?? "#E9560A",
  };

  return <main className={`public-invitation-page invitation-example-page${query.vista === "decoracion" ? " invitation-example-decoration" : ""}`}>
    <InvitationCanvas {...invitation} />
  </main>;
}
