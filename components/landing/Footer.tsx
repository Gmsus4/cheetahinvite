import { BrandEmblem } from "@/components/BrandEmblem";
import Link from "next/link";
import { FiArrowUp, FiArrowUpRight, FiMessageCircle } from "react-icons/fi";

export function Footer() {
  return (
    <footer className="home-footer">
      <div className="home-footer-shell">
        <div className="home-footer-main">
          <div className="footer-brand-block">
            <a className="brand" href="#inicio" aria-label="Cheetah Invite, inicio">
              <BrandEmblem size={42} />
              <span className="brand-name">Cheetah<span>Invite</span></span>
            </a>
            <p>Invitaciones digitales para momentos<br />que se quedan contigo.</p>
          </div>
          <div className="footer-link-group">
            <span className="footer-group-label">DESCUBRE CHEETAH INVITE</span>
            <nav className="footer-navigation" aria-label="Navegación al pie de página">
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#precios">Precios</a>
              <a href="#preguntas-frecuentes">Preguntas frecuentes</a>
            </nav>
          </div>
          <div className="footer-help">
            <span className="footer-group-label">TE ACOMPAÑAMOS</span>
            <p>¿Una duda antes de empezar?</p>
            <Link className="footer-help-link" href="/ayuda">
              <span className="footer-help-icon"><FiMessageCircle aria-hidden="true" /></span>
              Ayuda y soporte <FiArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="home-footer-bottom">
          <small>© 2026 Cheetah Invite. Celebra a tu manera.</small>
          <nav className="footer-legal-links" aria-label="Información legal">
            <Link href="/terminos">Términos y condiciones</Link>
            <Link href="/aviso-de-privacidad">Privacidad</Link>
          </nav>
          <a className="footer-back-top" href="#inicio">Volver arriba <span><FiArrowUp aria-hidden="true" /></span></a>
        </div>
      </div>
    </footer>
  );
}
