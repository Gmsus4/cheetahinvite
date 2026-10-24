"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleGoogleSignIn() {
    setIsLoading(true);
    await signIn("google", { redirectTo: "/dashboard" });
  }

  return (
    <button
      className="google-signin-button"
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      <FcGoogle aria-hidden="true" />
      {isLoading ? "Conectando con Google…" : "Continuar con Google"}
    </button>
  );
}
