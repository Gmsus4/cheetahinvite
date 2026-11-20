import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { authPageHref } from "@/lib/auth-destination";

export function AuthAccountSwitch({ mode, redirectTo = "/dashboard", inline = false, className }: {
  mode: "login" | "register";
  redirectTo?: string;
  inline?: boolean;
  className?: string;
}) {
  const login = mode === "login";
  if (inline) return <p className={className}>
    {login ? "¿Todavía no tienes cuenta? " : "¿Ya tienes cuenta? "}
    <Link href={authPageHref(login ? "/registro" : "/login", redirectTo)}>
      {login ? "Regístrate gratis" : "Iniciar sesión"}
    </Link>
  </p>;
  return <nav className="auth-account-switch" aria-label="Acceso a tu cuenta">
    <ThemeToggle />
    <span>{login ? "¿Eres nuevo?" : "¿Ya tienes cuenta?"}</span>
    <Link href={authPageHref(login ? "/registro" : "/login", redirectTo)}>
      {login ? "Crear cuenta" : "Iniciar sesión"}
    </Link>
  </nav>;
}
