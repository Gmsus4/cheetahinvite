import Image from "next/image";

export function Footer() {
  return (
    <footer className="site-footer">
      <a className="brand" href="#inicio">
        <Image
          className="brand-mascot"
          src="/cheetah-mascot.png"
          alt=""
          width={32}
          height={35}
        />
        <span className="brand-name">
          Cheetah<span>Invite</span>
        </span>
      </a>
      <span>Invitaciones digitales para momentos especiales.</span>
      <div>
        <a href="#plantillas">Plantillas</a>
        <a href="#precios">Precios</a>
        <a href="mailto:hola@cheetahinvite.com">Contacto</a>
      </div>
      <div className="footer-legal-links">
        <a href="/terminos">Términos</a>
        <a href="/aviso-de-privacidad">Privacidad</a>
      </div>
      <small>© 2026 Cheetah Invite</small>
    </footer>
  );
}
