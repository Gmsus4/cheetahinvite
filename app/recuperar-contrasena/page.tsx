import type { Metadata } from "next";
import { RecoveryPage } from "@/components/login/RecoveryPage";
import { PasswordRecoveryForm } from "@/components/login/PasswordRecoveryForm";
import { ManualPasswordRecovery } from "@/components/login/ManualPasswordRecovery";
import "../login/login.css";

export const metadata: Metadata = { title: "Recuperar contraseña | Cheetah Invite", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function ForgotPasswordPage() {
  return <RecoveryPage title="Recupera tu acceso" description="Solicita ayuda al equipo para volver a entrar a tu cuenta.">
    <ManualPasswordRecovery />
    <details className="recovery-automatic">
      <summary>Otra opción: recibir un enlace automático</summary>
      <p className="manual-recovery-note">Escribe el correo con el que creaste tu cuenta. El enlace vence en 30 minutos.</p>
      <PasswordRecoveryForm />
    </details>
  </RecoveryPage>;
}
