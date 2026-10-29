import Link from "next/link";

export function AuthAccountSwitch({ mode }: { mode: "login" | "register" }) {
  const login = mode === "login";
  return <nav className="auth-account-switch" aria-label="Acceso a tu cuenta">
    <span>{login ? "¿Eres nuevo?" : "¿Ya tienes cuenta?"}</span>
    <Link href={login ? "/registro" : "/login"}>
      {login ? "Crear cuenta" : "Iniciar sesión"}
    </Link>
  </nav>;
}
