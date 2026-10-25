import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { InvitationCanvas } from "@/components/dashboard/EventEditor";
import { landingEventExamples, landingInvitationExample, landingInvitationStyles } from "@/lib/landing-invitation-example";
import "./example.css";

export const metadata: Metadata = {
  title: "Invitación de ejemplo | Cheetah Invite",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return [...landingInvitationStyles, ...landingEventExamples].map(({ slug }) => ({ style: slug }));
}

type ExampleProps = {
  params: Promise<{ style: string }>;
  searchParams: Promise<{ vista?: string | string[] }>;
};

export default function InvitationExamplePage(props: ExampleProps) {
  return <Suspense fallback={<p role="status">Preparando invitación de ejemplo…</p>}>
    <InvitationExampleData {...props} />
  </Suspense>;
}

async function InvitationExampleData({ params, searchParams }: ExampleProps) {
  const [{ style }, query] = await Promise.all([params, searchParams]);
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
