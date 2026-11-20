import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import { BrandWordmark } from "@/components/BrandWordmark";
import styles from "./DashboardFooter.module.css";

export function DashboardFooter() {
  return <footer className={styles.footer}>
    <div className={styles.main}>
      <div className={styles.identity}>
        <Link className={styles.brand} href="/" aria-label="Soccasion, inicio"><BrandWordmark /></Link>
        <p>Hecho para celebrar cada historia.</p>
      </div>
      <Link className={styles.support} href="/ayuda"><span><strong>Estamos para ayudarte</strong><small>Ayuda con tu cuenta, invitación o compra</small></span><span className={styles.arrow}><FiArrowUpRight aria-hidden="true" /></span></Link>
    </div>
    <div className={styles.bottom}>
      <span>© Soccasion</span>
      <nav aria-label="Información legal"><Link href="/terminos">Términos y condiciones</Link><Link href="/aviso-de-privacidad">Privacidad</Link></nav>
    </div>
  </footer>;
}
