import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { authPageHref } from "@/lib/auth-destination";

export function AuthAccountSwitch({ mode, redirectTo = "/dashboard" }: { mode: "login" | "register"; redirectTo?: string }) {
  const login = mode === "login";
  return <nav className="auth-account-switch" aria-label="Acceso a tu cuenta">
    <ThemeToggle />
    <span>{login ? "¿Eres nuevo?" : "¿Ya tienes cuenta?"}</span>
    <Link href={authPageHref(login ? "/registro" : "/login", redirectTo)}>
      {login ? "Crear cuenta" : "Iniciar sesión"}
    </Link>
  </nav>;
}
