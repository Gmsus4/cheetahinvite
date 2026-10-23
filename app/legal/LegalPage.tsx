import Link from "next/link";

type Section = { title: string; body: React.ReactNode };

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
    <main className="legal-page">
      <header className="legal-header">
        <Link className="legal-brand" href="/">Cheetah<span>Invite</span></Link>
        <Link className="legal-home" href="/">Volver al inicio <span aria-hidden="true">→</span></Link>
      </header>
      <article className="legal-document">
        <p className="legal-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="legal-intro">{intro}</p>
        <p className="legal-updated">Última actualización: {updated}</p>
        <div className="legal-notice"><strong>Antes de publicar:</strong> completa los campos señalados como <code>[POR DEFINIR]</code> con información real de la persona o empresa que opera Cheetah Invite. Este borrador no sustituye una revisión legal.</div>
        <nav className="legal-toc" aria-label="Contenido">
          <strong>En esta página</strong>
          <ol>{sections.map((section, index) => <li key={section.title}><a href={`#seccion-${index + 1}`}>{section.title}</a></li>)}</ol>
        </nav>
        {sections.map((section, index) => <section className="legal-section" id={`seccion-${index + 1}`} key={section.title}><h2>{index + 1}. {section.title}</h2><div>{section.body}</div></section>)}
        <p className="legal-contact">¿Necesitas ayuda? Escribe a <a href="mailto:hola@cheetahinvite.com">hola@cheetahinvite.com</a>.</p>
      </article>
      <footer className="legal-footer"><Link href="/terminos">Términos y condiciones</Link><Link href="/aviso-de-privacidad">Aviso de privacidad</Link><span>© 2026 Cheetah Invite</span></footer>
    </main>
  );
}
