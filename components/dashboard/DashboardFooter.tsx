import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import { BrandEmblem } from "@/components/BrandEmblem";
import styles from "./DashboardFooter.module.css";

export function DashboardFooter() {
  return <footer className={styles.footer}>
    <div className={styles.main}>
      <div className={styles.identity}>
        <Link className={styles.brand} href="/" aria-label="Cheetah Invite, inicio"><BrandEmblem size={30} /><span>Cheetah<span>Invite</span></span></Link>
        <p>Hecho para celebrar cada historia.</p>
      </div>
      <Link className={styles.support} href="/ayuda"><span><strong>Estamos para ayudarte</strong><small>Ayuda con tu cuenta, invitación o compra</small></span><span className={styles.arrow}><FiArrowUpRight aria-hidden="true" /></span></Link>
    </div>
    <div className={styles.bottom}>
      <span>© Cheetah Invite</span>
      <nav aria-label="Información legal"><Link href="/terminos">Términos y condiciones</Link><Link href="/aviso-de-privacidad">Privacidad</Link></nav>
    </div>
  </footer>;
}
