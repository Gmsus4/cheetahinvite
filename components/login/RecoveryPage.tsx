import Link from "next/link";
import type { ReactNode } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { BrandEmblem } from "@/components/BrandEmblem";

export function RecoveryPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main className="login-page">
    <header className="login-topbar">
      <Link className="brand" href="/" aria-label="Cheetah Invite, inicio"><BrandEmblem size={40} priority /><span className="brand-name">Cheetah<span>Invite</span></span></Link>
      <Link className="login-back" href="/login"><FiArrowLeft aria-hidden="true" /> Volver a iniciar sesión</Link>
    </header>
    <div className="login-layout">
      <section className="login-visual" aria-label="Recupera tu acceso">
        <span className="login-kicker">VUELVE A TU ESPACIO</span>
        <h1>Tus momentos<br />te están<br /><em>esperando.</em></h1>
        <p>Recupera el acceso a tu cuenta para seguir preparando tus celebraciones.</p>
        <div className="login-decoration" aria-hidden="true"><div className="login-orbit orbit-one" /><div className="login-orbit orbit-two" /></div>
        <div className="login-visual-footer">CELEBRA CADA HISTORIA</div>
      </section>
      <section className="login-form-panel" aria-labelledby="recovery-title">
        <div className="login-form-wrap">
          <span className="login-kicker">TU CUENTA CHEETAH INVITE</span>
          <h2 id="recovery-title">{title}</h2>
          <p className="login-description">{description}</p>
          {children}
        </div>
      </section>
    </div>
  </main>;
}
