import { BrandWordmark } from "@/components/BrandWordmark";
import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer({ homePage = true, hideSupportLink = false, currentPath }: {
  homePage?: boolean;
  hideSupportLink?: boolean;
  currentPath?: "/terminos" | "/aviso-de-privacidad";
}) {
  return (
    <footer className={styles.footer}>
      <div className={styles.invitation}>
        <div>
          <span className={styles.kicker}>TU PRÓXIMA HISTORIA EMPIEZA AQUÍ</span>
          <h2>Hay mucho<br />por celebrar.</h2>
        </div>
        <div className={styles.action}>
          <p>Empieza con una invitación que se sienta muy tuya.</p>
          <Link className={styles.create} href="/crear">Crear mi invitación gratis</Link>
          <span>Diseña a tu ritmo. Paga solo al publicar.</span>
        </div>
      </div>

      <div className={styles.navigation}>
        <div className={styles.brandBlock}>
          <Link className={styles.brand} href="/" aria-label="Soccasion, inicio">
            <BrandWordmark />
          </Link>
          <p>Para los días que quieres<br />compartir con todos.</p>
        </div>
        <nav className={styles.linkGroup} aria-label="Descubre Soccasion">
          <span className={styles.label}>EXPLORA</span>
          <a href={`${homePage ? "" : "/"}#como-funciona`}>Cómo funciona</a>
          <Link href="/demo">Ver diseños</Link>
          <a href={`${homePage ? "" : "/"}#precios`}>Precios</a>
        </nav>
        <nav className={styles.linkGroup} aria-label="Ayuda para tu invitación">
          <span className={styles.label}>TE ACOMPAÑAMOS</span>
          <a href={`${homePage ? "" : "/"}#preguntas-frecuentes`}>Preguntas frecuentes</a>
          {!hideSupportLink && <Link href="/ayuda">Ayuda y soporte</Link>}
          <Link href="/login">Iniciar sesión</Link>
        </nav>
      </div>

      <div className={styles.bottom}>
        <small>© 2026 Soccasion</small>
        <nav className={styles.legal} aria-label="Información legal">
          {currentPath !== "/terminos" && <Link href="/terminos">Términos y condiciones</Link>}
          {currentPath !== "/aviso-de-privacidad" && <Link href="/aviso-de-privacidad">Privacidad</Link>}
        </nav>
        <a className={styles.backTop} href="#">Volver al inicio</a>
      </div>
    </footer>
  );
}
