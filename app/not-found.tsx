import type { Metadata } from "next";
import Link from "next/link";
import { FiHome } from "react-icons/fi";
import { BrandWordmark } from "@/components/BrandWordmark";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Página no encontrada | Soccasion",
  description: "No encontramos la página que buscas. Vuelve al inicio de Soccasion.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <div className={styles.page}>
    <header className={styles.header}>
      <div className={styles.brand}><BrandWordmark /></div>
    </header>
    <main className={styles.main}>
      <div className={styles.content}>
        <p className={styles.code} aria-label="Error 404">404</p>
        <h1>No encontramos esta página</h1>
        <p className={styles.description}>Puede que el enlace haya cambiado o que la dirección no sea correcta. Te ayudamos a encontrar el camino.</p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primary}><FiHome aria-hidden="true" />Volver al inicio</Link>
        </div>
        <p className={styles.note}>¿Buscabas una invitación? Revisa el enlace que te compartieron y vuelve a intentarlo.</p>
      </div>
    </main>
    <footer className={styles.footer}>Siempre hay algo que celebrar.</footer>
  </div>;
}
