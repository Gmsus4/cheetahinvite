import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandLoader } from "@/components/BrandLoader";
import { Navbar } from "@/components/landing/Navbar";
import { DemoTemplateGallery } from "@/components/landing/DemoTemplateGallery";
import { getShowcaseExamples, showcasePreview } from "@/lib/showcase";
import { demoPreviewImage } from "@/lib/demo-preview";
import { exampleWithImages } from "@/lib/invitation-example-images";
import styles from "./demo.module.css";
import "../landing-home.css";

export const metadata: Metadata = {
  title: "Demos de invitaciones | Cheetah Invite",
  description: "Explora nuestros diseños de invitaciones digitales y prueba las demos para encontrar el estilo de tu celebración.",
};

export default function DemoPage() {
  return <div className={`landing-home ${styles.page}`}>
    <Navbar homePage={false} />
    <main className={styles.content} id="inicio">
      <div className={styles.intro}><span className={styles.eyebrow}>DEMOS DE INVITACIONES</span><h1>Encuentra tu estilo</h1><p>Explora los diseños y abre una demo para conocer todos sus detalles. Elige tu favorita y hazla tuya.</p></div>
      <Suspense fallback={<BrandLoader message="Cargando demos…" />}><DemoExamples /></Suspense>
    </main>
  </div>;
}

async function DemoExamples() {
  const [catalog, hero] = await Promise.all([getShowcaseExamples("catalog"), getShowcaseExamples("hero")]);
  const examples = Array.from(new Map([...catalog, ...hero].map(example => [example.slug, example])).values())
    .map(example => {
      const invitation = "imageFolder" in example ? exampleWithImages(example) : example.invitation;
      const thumbnail = showcasePreview(invitation);
      return { slug: example.slug, label: example.label, typeLabel: example.typeLabel, previewImage: demoPreviewImage(invitation, example.slug), fallbackImage: thumbnail.imageUrl || thumbnail.backgroundImageUrl || "" };
    });
  return <DemoTemplateGallery examples={examples} />;
}

