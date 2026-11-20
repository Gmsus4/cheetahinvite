import type { Metadata } from "next";
import Link from "next/link";
import { FiCreditCard, FiEdit3, FiMail, FiUser } from "react-icons/fi";
import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BrandLoader } from "@/components/BrandLoader";
import { SupportRequest } from "@/components/SupportRequest";
import { SUPPORT_EMAIL } from "@/lib/support";
import "../landing-home.css";
import "./soporte.css";
import styles from "./help.module.css";

export const metadata: Metadata = { title: "Ayuda y soporte | Soccasion", description: "Recibe ayuda con tu cuenta, tu invitación y tus compras en Soccasion." };

export default function HelpPage() {
  return <Suspense fallback={<BrandLoader message="Preparando la ayuda…" />}><HelpContent /></Suspense>;
}

async function HelpContent() {
  await connection();
  const session = await auth();
  return <main className={`landing-home support-page ${styles.page}`}>
    <Navbar homePage={false} />
    <div className="support-shell" id="inicio">
      <section className={styles.hero} aria-labelledby="support-title">
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>AYUDA Y SOPORTE</span>
          <h1 id="support-title">Estamos aquí<br />para ayudarte.</h1>
          <p>Resuelve tus dudas y sigue preparando tu gran día. Tu cuenta, tu invitación y tus compras, con todo más claro.</p>
        </div>
        <div className={styles.contactBox}>
          <span className={styles.mailIcon}><FiMail aria-hidden="true" /></span>
          <span className={styles.contactLabel}>HABLEMOS POR CORREO</span>
          <a className={styles.emailLink} href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          <p>Escríbenos directamente o prepara tu consulta con el formulario de abajo.</p>
          <a className="button" href="#contactar-soporte">Contactar al equipo</a>
        </div>
      </section>
      <nav className={styles.topics} aria-label="Temas de ayuda">
        <a href="#ayuda-cuenta"><FiUser aria-hidden="true" /><span>Cuenta y acceso<small>Vuelve a tu espacio</small></span></a>
        <a href="#ayuda-invitacion"><FiEdit3 aria-hidden="true" /><span>Tu invitación<small>Edición y publicación</small></span></a>
        <a href="#ayuda-pagos"><FiCreditCard aria-hidden="true" /><span>Pagos y compras<small>Cargos, referencias y reembolsos</small></span></a>
      </nav>
      <div className="support-layout">
        <section className={`support-card ${styles.contactCard}`} id="contactar-soporte" aria-labelledby="support-contact-title"><div className={styles.sectionHeading}><span className={styles.eyebrow}>CUÉNTANOS QUÉ NECESITAS</span><h2 id="support-contact-title">Hablemos de tu caso.</h2></div><p className={styles.intro}>Completa los detalles y prepararemos un correo para que lo revises y envíes.</p><SupportRequest initialEmail={session?.user?.email ?? ""} /></section>
        <section className="support-card support-faq" id="preguntas-frecuentes" aria-labelledby="support-faq-title"><div className={styles.sectionHeading}><span className={styles.eyebrow}>RESPUESTAS A LA MANO</span><h2 id="support-faq-title">Quizá tu duda esté aquí.</h2></div><p className={styles.intro}>Encuentra ayuda sobre las consultas más frecuentes.</p>
          <details id="ayuda-pagos"><summary>Me cobraron, pero mi invitación no se publicó</summary><p>Abre <Link href="/dashboard/compras">Mis compras</Link>, entra en «Ver detalle» y pulsa «Actualizar estado del pago». Allí también se conservan compras de invitaciones eliminadas. Si sigue sin resolverse, escríbenos con la referencia. Evita volver a pagar hasta aclarar el cobro.</p></details>
          <details><summary>¿Qué pasa con el enlace si hay un reembolso o una disputa?</summary><p>Un reembolso total confirmado retira el enlace y uno parcial lo mantiene durante su vigencia. Una disputa lo suspende; si se gana, se reactiva conservando el vencimiento original, siempre que la invitación siga disponible y no esté totalmente reembolsada. Puedes revisar estos estados en Mis compras.</p></details>
          <details><summary>Creo que pagué dos veces</summary><p>Indica cuándo ocurrieron los cargos y la referencia de la invitación. El equipo comprobará las operaciones antes de confirmar qué pasó. No compartas datos completos de tu tarjeta.</p></details>
          <details><summary>¿Cuánto dura mi invitación y cómo la renuevo?</summary><p>Tu compra activa un año desde la confirmación del pago. En Ajustes y en Pago y soporte puedes consultar los días transcurridos, los días restantes y la fecha de vencimiento. Al vencer, el enlace y la edición se desactivan y la invitación se archiva durante un mes natural. Durante ese mes puedes comprar otro año desde Pago y soporte y recuperar el contenido y el mismo enlace. Sin renovación, se elimina automáticamente al terminar el mes. No hay cobros automáticos.</p></details>
          <details id="ayuda-invitacion"><summary>No puedo editar o abrir mi invitación</summary><p>Comprueba que entraste con el correo con el que la creaste. Desde tu panel puedes revisar si es un borrador, está publicada o ha vencido.</p></details>
          <details><summary>¿Cómo solicito un reembolso?</summary><p>La política comercial contempla fallas atribuibles a Soccasion que impidan prestar el servicio y cobros duplicados causados por un error del sistema. Selecciona ese motivo y describe el problema; el equipo revisará tu caso y responderá por correo. No se ofrece devolución comercial por cambio de opinión, sin perjuicio de los derechos que correspondan por ley. Consulta los <Link href="/terminos">términos y condiciones</Link>.</p></details>
          <details id="ayuda-cuenta"><summary>Olvidé mi contraseña</summary><p>Puedes solicitar ayuda desde <Link href="/recuperar-contrasena">Recuperar contraseña</Link>. Si creaste tu cuenta únicamente con Google, utiliza «Continuar con Google» al iniciar sesión.</p></details>
          <details><summary>¿Dónde encuentro la referencia?</summary><p>En tu dashboard, abre «Pago y soporte» en la tarjeta de tu invitación. Allí encontrarás la referencia de la invitación y el detalle de tu compra. También puedes consultar las referencias desde <Link href="/dashboard/compras">Mis compras</Link>.</p></details>
        </section>
      </div>
    </div>
    <Footer homePage={false} hideSupportLink />
  </main>;
}
