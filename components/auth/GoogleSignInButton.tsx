"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { safeAuthDestination } from "@/lib/auth-destination";

export function GoogleSignInButton({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleGoogleSignIn() {
    setIsLoading(true);
    await signIn("google", { redirectTo: safeAuthDestination(redirectTo) });
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
