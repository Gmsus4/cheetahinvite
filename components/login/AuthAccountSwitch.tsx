import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthAccountSwitch({ mode }: { mode: "login" | "register" }) {
  const login = mode === "login";
  return <nav className="auth-account-switch" aria-label="Acceso a tu cuenta">
    <ThemeToggle />
    <span>{login ? "¿Eres nuevo?" : "¿Ya tienes cuenta?"}</span>
    <Link href={login ? "/registro" : "/login"}>
      {login ? "Crear cuenta" : "Iniciar sesión"}
    </Link>
  </nav>;
}
