import { ClosingCta } from "@/components/landing/ClosingCta";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Navbar } from "@/components/landing/Navbar";
import { Pricing } from "@/components/landing/Pricing";
import { TemplateGallery } from "@/components/landing/TemplateGallery";
import { TrustStrip } from "@/components/landing/TrustStrip";
import "./landing-home.css";

export default function Home() {
  return (
    <Suspense fallback={<LandingContent />}>
      <AuthenticatedHome />
    </Suspense>
  );
}

async function AuthenticatedHome() {
  await connection();
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return <LandingContent />;
}

function LandingContent() {
  return (
    <main className="landing-home">
      <Navbar />
      <Hero />
      <TrustStrip />
      <TemplateGallery />
      <HowItWorks />
      <Pricing />
      <ClosingCta />
      <Footer />
    </main>
  );
}
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
