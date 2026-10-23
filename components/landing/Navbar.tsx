import Image from "next/image";
import { FiArrowUpRight } from "react-icons/fi";

export function Navbar() {
  return (
    <header className="site-header">
      <a className="brand" href="#inicio" aria-label="Cheetah Invite, inicio">
        <Image
          className="brand-mascot"
          src="/cheetah-mascot.png"
          alt=""
          width={40}
          height={44}
          priority
        />
        <span className="brand-name">
          Cheetah<span>Invite</span>
        </span>
      </a>

      <nav className="main-nav" aria-label="Navegación principal">
        <a href="#plantillas">Plantillas</a>
        <a href="#como-funciona">Cómo funciona</a>
        <a href="#precios">Precios</a>
      </nav>

      <div className="header-actions">
        <a className="login-link" href="/login">
          Iniciar sesión
        </a>
        <a className="button button-small" href="/crear">
          Crear invitación <span><FiArrowUpRight aria-hidden="true" /></span>
        </a>
      </div>
    </header>
  );
}
