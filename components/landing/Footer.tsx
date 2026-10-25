import { BrandEmblem } from "@/components/BrandEmblem";
import { FiArrowUp, FiArrowUpRight } from "react-icons/fi";

export function Footer() {
  return (
    <footer className="home-footer">
      <div className="home-footer-shell">
      <div className="home-footer-main">
      <div className="footer-brand-block">
        <a className="brand" href="#inicio" aria-label="Cheetah Invite, inicio">
          <BrandEmblem size={40} />
          <span className="brand-name">
            Cheetah<span>Invite</span>
          </span>
        </a>
        <p>Los grandes momentos empiezan<br />con una invitación.</p>
      </div>
      <div className="footer-link-group">
      <span className="footer-group-label">EXPLORA</span>
      <nav className="footer-navigation" aria-label="Navegación al pie de página">
        <a href="#personalizacion">Personalización</a>
        <a href="#como-funciona">Cómo funciona</a>
        <a href="#precios">Precios</a>
      </nav>
      </div>
      <div className="footer-start">
        <span className="footer-group-label">TU PRÓXIMA CELEBRACIÓN</span>
        <p>Hazla tuya.<br />Compártela con todos.</p>
        <a className="button" href="/crear">Crea tu invitación <FiArrowUpRight aria-hidden="true" /></a>
      </div>
      </div>
      <div className="home-footer-bottom">
      <small>© 2026 Cheetah Invite</small>
      <nav className="footer-legal-links" aria-label="Información legal">
        <a href="/terminos">Términos y condiciones</a>
        <a href="/aviso-de-privacidad">Privacidad</a>
      </nav>
      <a className="footer-back-top" href="#inicio">Volver arriba <FiArrowUp aria-hidden="true" /></a>
      </div>
      </div>
    </footer>
  );
}
