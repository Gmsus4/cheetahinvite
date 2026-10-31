import Link from "next/link";
import { FiArrowUp, FiArrowUpRight, FiClock, FiFileText } from "react-icons/fi";
import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import "./legal.css";

type Section = { title: string; body: React.ReactNode };

async function LegalNavigation() {
  await connection();
  const session = await auth();
  return <DashboardHeader name={session?.user?.name || "Usuario"} email={session?.user?.email || ""} image={session?.user?.image} guest={!session?.user} />;
}

export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  sections: Section[];
}) {
  return (
    <main className="legal-page legal-modern" id="documento">
      <Suspense fallback={<DashboardHeader name="" email="" guest />}><LegalNavigation /></Suspense>
      <div className="legal-shell">
      <div className="legal-hero">
        <span className="legal-hero-icon" aria-hidden="true"><FiFileText /></span>
        <p className="legal-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="legal-intro">{intro}</p>
        <p className="legal-updated"><FiClock aria-hidden="true" /> Última actualización: {updated}</p>
      </div>
      <div className="legal-reading-layout">
      <aside className="legal-sidebar">
        <nav className="legal-toc" aria-label="Contenido">
          <span className="legal-toc-label">EN ESTE DOCUMENTO</span>
          <ol>{sections.map((section, index) => <li key={section.title}><a href={`#seccion-${index + 1}`}><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</a></li>)}</ol>
          <a className="legal-top-link" href="#documento">Volver arriba <FiArrowUp aria-hidden="true" /></a>
        </nav>
      </aside>
      <article className="legal-document" aria-label={title}>
        {/* <div className="legal-notice"><strong>Antes de publicar:</strong> completa los campos señalados como <code>[POR DEFINIR]</code> con información real de la persona o empresa que opera Cheetah Invite. Este borrador no sustituye una revisión legal.</div> */}
        {sections.map((section, index) => <section className="legal-section" id={`seccion-${index + 1}`} key={section.title}><span className="legal-section-number">SECCIÓN {String(index + 1).padStart(2, "0")}</span><h2>{section.title}</h2><div>{section.body}</div></section>)}
        <div className="legal-contact"><strong>¿Necesitas ayuda?</strong><p>Si tienes alguna duda, estamos para orientarte.</p><a href="mailto:cheetahinvite@gmail.com">cheetahinvite@gmail.com <FiArrowUpRight aria-hidden="true" /></a></div>
      </article>
      </div>
      </div>
      <footer className="legal-footer"><Link href="/terminos">Términos y condiciones</Link><Link href="/aviso-de-privacidad">Aviso de privacidad</Link><span>© 2026 Cheetah Invite</span></footer>
    </main>
  );
}
