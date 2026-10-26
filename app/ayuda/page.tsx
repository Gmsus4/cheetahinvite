import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import { BrandEmblem } from "@/components/BrandEmblem";
import { SupportRequest } from "@/components/SupportRequest";
import { SUPPORT_EMAIL } from "@/lib/support";
import "./soporte.css";

export const metadata: Metadata = { title: "Ayuda y soporte | Cheetah Invite", description: "Recibe ayuda con tu cuenta, tu invitación y tus compras en Cheetah Invite." };

export default function HelpPage() {
  return <main className="support-page">
    <header className="support-header"><Link className="brand" href="/" aria-label="Cheetah Invite, inicio"><BrandEmblem size={40} /><span className="brand-name">Cheetah<span>Invite</span></span></Link><Link href="/dashboard">Ir a mi panel <FiArrowUpRight aria-hidden="true" /></Link></header>
    <div className="support-shell">
      <div className="support-heading"><p className="dashboard-eyebrow">ESTAMOS PARA AYUDARTE</p><h1>Ayuda y soporte</h1><p>Cuéntanos qué ocurrió con tu invitación o tu compra. Atenderemos tu solicitud por correo.</p><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></div>
      <div className="support-layout">
        <section className="support-card" aria-labelledby="support-contact-title"><h2 id="support-contact-title">Contacta al equipo</h2><SupportRequest /></section>
        <section className="support-card support-faq" aria-labelledby="support-faq-title"><h2 id="support-faq-title">Antes de escribirnos</h2>
          <details><summary>Me cobraron, pero mi invitación no se publicó</summary><p>Abre la pantalla de pago de esa invitación y revisa su estado. Si sigue sin publicarse, escríbenos con la referencia. Evita volver a pagar hasta aclarar el cobro.</p></details>
          <details><summary>Creo que pagué dos veces</summary><p>Indica cuándo ocurrieron los cargos y la referencia de la invitación. El equipo comprobará las operaciones antes de confirmar qué pasó. No compartas datos completos de tu tarjeta.</p></details>
          <details><summary>No puedo editar o abrir mi invitación</summary><p>Comprueba que entraste con el correo con el que la creaste. Desde tu panel puedes revisar si es un borrador, está publicada o ha vencido.</p></details>
          <details><summary>¿Cómo solicito un reembolso?</summary><p>La política comercial contempla fallas atribuibles a Cheetah Invite que impidan prestar el servicio y cobros duplicados causados por un error del sistema. Selecciona ese motivo y describe el problema; el equipo revisará tu caso y responderá por correo. No se ofrece devolución comercial por cambio de opinión, sin perjuicio de los derechos que correspondan por ley. Consulta los <Link href="/terminos">términos y condiciones</Link>.</p></details>
          <details><summary>Olvidé mi contraseña</summary><p>Puedes solicitar ayuda desde <Link href="/recuperar-contrasena">Recuperar contraseña</Link>. Si creaste tu cuenta únicamente con Google, utiliza «Continuar con Google» al iniciar sesión.</p></details>
          <details><summary>¿Dónde encuentro la referencia?</summary><p>Entra al editor de tu invitación. Al inicio encontrarás el apartado «Pago y soporte» con la referencia y el botón «Ver pago y soporte». También puedes abrir el pago desde el botón «Pago» de tu invitación en el dashboard.</p></details>
        </section>
      </div>
      <footer className="support-footer"><Link href="/">Volver al inicio</Link><Link href="/terminos">Términos y condiciones</Link><Link href="/aviso-de-privacidad">Privacidad</Link></footer>
    </div>
  </main>;
}
