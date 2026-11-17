import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { Footer } from "@/components/landing/Footer";
import { FAQ } from "@/components/landing/FAQ";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Navbar } from "@/components/landing/Navbar";
import { Pricing } from "@/components/landing/Pricing";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { Benefits } from "@/components/landing/Benefits";
import { LandingMotion } from "@/components/landing/LandingMotion";
import "./landing-home.css";

export const metadata: Metadata = {
  title: "Cheetah Invite — Invitaciones digitales para tu evento",
  description:
    "Crea gratis tu invitación digital con fotos, ubicación y confirmación de asistencia. Personalízala, revisa el resultado y paga solo al publicar.",
};

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <>
      <Suspense fallback={null}>
        <AuthenticatedHome searchParams={searchParams} />
      </Suspense>
      <LandingContent />
    </>
  );
}

async function AuthenticatedHome({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  await connection();
  const session = await auth();
  const query = await searchParams;
  if (session?.user?.role === "ADMIN" && query.vista === "publica") return null;
  if (session?.user?.id) redirect("/dashboard");

  return null;
}

function LandingContent() {
  return (
    <LandingMotion>
      <Navbar />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <Benefits />
      <Pricing />
      <FAQ />
      <Footer />
    </LandingMotion>
  );
}
