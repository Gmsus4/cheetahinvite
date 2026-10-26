import type { Metadata } from "next";
import { RecoveryPage } from "@/components/login/RecoveryPage";
import { PasswordRecoveryForm } from "@/components/login/PasswordRecoveryForm";
import "../login/login.css";

export const metadata: Metadata = { title: "Nueva contraseña | Cheetah Invite", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function ResetPasswordPage() {
  return <RecoveryPage title="Crea una nueva contraseña" description="Elige una contraseña para volver a entrar a tu cuenta. Por seguridad, se cerrarán tus sesiones anteriores."><PasswordRecoveryForm reset /></RecoveryPage>;
}
