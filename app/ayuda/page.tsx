import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BrandLoader } from "@/components/BrandLoader";
import { SupportRequest } from "@/components/SupportRequest";
import { SUPPORT_EMAIL } from "@/lib/support";
import "./soporte.css";
import styles from "./help.module.css";

export const metadata: Metadata = { title: "Ayuda y soporte | Cheetah Invite", description: "Recibe ayuda con tu cuenta, tu invitación y tus compras en Cheetah Invite." };

export default function HelpPage() {
  return <Suspense fallback={<BrandLoader message="Preparando la ayuda…" />}><HelpContent /></Suspense>;
}

async function HelpContent() {
  await connection();
  const session = await auth();
  return <main className={`support-page ${styles.page}`}>
    <DashboardHeader name={session?.user?.name || "Usuario"} email={session?.user?.email || ""} image={session?.user?.image} active="help" guest={!session?.user} />
    <div className="support-shell">
      <div className="support-heading"><span className={styles.eyebrow}>ESTAMOS PARA AYUDARTE</span><h1>Ayuda y soporte</h1><a className={styles.emailLink} href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}<FiArrowUpRight aria-hidden="true" /></a></div>
      <div className="support-layout">
        <section className="support-card" id="contactar-soporte" aria-labelledby="support-contact-title"><div className={styles.sectionHeading}><h2 id="support-contact-title">Contacta al equipo</h2></div><p className={styles.intro}>Cuéntanos qué ocurrió y prepararemos un correo para revisar tu caso.</p><SupportRequest initialEmail={session?.user?.email ?? ""} /></section>
        <section className="support-card support-faq" id="preguntas-frecuentes" aria-labelledby="support-faq-title"><div className={styles.sectionHeading}><h2 id="support-faq-title">Preguntas frecuentes</h2></div>
          <details><summary>Me cobraron, pero mi invitación no se publicó</summary><p>Abre <Link href="/dashboard/compras">Mis compras</Link>, entra en «Ver detalle» y pulsa «Actualizar estado del pago». Allí también se conservan compras de invitaciones eliminadas. Si sigue sin resolverse, escríbenos con la referencia. Evita volver a pagar hasta aclarar el cobro.</p></details>
          <details><summary>¿Qué pasa con el enlace si hay un reembolso o una disputa?</summary><p>Un reembolso total confirmado retira el enlace y uno parcial lo mantiene durante su vigencia. Una disputa lo suspende; si se gana, se reactiva conservando el vencimiento original, siempre que la invitación siga disponible y no esté totalmente reembolsada. Puedes revisar estos estados en Mis compras.</p></details>
          <details><summary>Creo que pagué dos veces</summary><p>Indica cuándo ocurrieron los cargos y la referencia de la invitación. El equipo comprobará las operaciones antes de confirmar qué pasó. No compartas datos completos de tu tarjeta.</p></details>
          <details><summary>¿Cuánto dura mi invitación y cómo la renuevo?</summary><p>Tu compra activa un año desde la confirmación del pago. En Ajustes y en Pago y soporte puedes consultar los días transcurridos, los días restantes y la fecha de vencimiento. Al vencer, el enlace y la edición se desactivan y la invitación se archiva durante un mes natural. Durante ese mes puedes comprar otro año desde Pago y soporte y recuperar el contenido y el mismo enlace. Sin renovación, se elimina automáticamente al terminar el mes. No hay cobros automáticos.</p></details>
          <details><summary>No puedo editar o abrir mi invitación</summary><p>Comprueba que entraste con el correo con el que la creaste. Desde tu panel puedes revisar si es un borrador, está publicada o ha vencido.</p></details>
          <details><summary>¿Cómo solicito un reembolso?</summary><p>La política comercial contempla fallas atribuibles a Cheetah Invite que impidan prestar el servicio y cobros duplicados causados por un error del sistema. Selecciona ese motivo y describe el problema; el equipo revisará tu caso y responderá por correo. No se ofrece devolución comercial por cambio de opinión, sin perjuicio de los derechos que correspondan por ley. Consulta los <Link href="/terminos">términos y condiciones</Link>.</p></details>
          <details><summary>Olvidé mi contraseña</summary><p>Puedes solicitar ayuda desde <Link href="/recuperar-contrasena">Recuperar contraseña</Link>. Si creaste tu cuenta únicamente con Google, utiliza «Continuar con Google» al iniciar sesión.</p></details>
          <details><summary>¿Dónde encuentro la referencia?</summary><p>En tu dashboard, abre «Pago y soporte» en la tarjeta de tu invitación. Allí encontrarás la referencia de la invitación y el detalle de tu compra. También puedes consultar las referencias desde <Link href="/dashboard/compras">Mis compras</Link>.</p></details>
        </section>
      </div>
      <footer className="support-footer"><Link href="/">Volver al inicio</Link><Link href="/terminos">Términos y condiciones</Link><Link href="/aviso-de-privacidad">Privacidad</Link></footer>
    </div>
  </main>;
}
