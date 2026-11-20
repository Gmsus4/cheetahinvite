import { FiClock, FiFileText } from "react-icons/fi";
import { LEGAL_OPERATOR } from "@/lib/legal";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import "../landing-home.css";
import "./legal.css";

type Section = { title: string; body: React.ReactNode };

export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
  currentPath,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  sections: Section[];
  currentPath: "/terminos" | "/aviso-de-privacidad";
}) {
  return (
    <main className="landing-home legal-page legal-modern">
      <Navbar homePage={false} />
      <div className="legal-shell" id="inicio">
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
          <a className="legal-top-link" href="#">Volver arriba</a>
        </nav>
      </aside>
      <article className="legal-document" aria-label={title}>
        {sections.map((section, index) => <section className="legal-section" id={`seccion-${index + 1}`} key={section.title}><span className="legal-section-number">SECCIÓN {String(index + 1).padStart(2, "0")}</span><h2>{section.title}</h2><div>{section.body}</div></section>)}
        <div className="legal-contact"><strong>¿Necesitas ayuda?</strong><p>Si tienes alguna duda, estamos para orientarte.</p><a className="button" href={LEGAL_OPERATOR.emailHref}>{LEGAL_OPERATOR.email}</a></div>
      </article>
      </div>
      </div>
      <Footer homePage={false} currentPath={currentPath} />
    </main>
  );
}
