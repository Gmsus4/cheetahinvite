"use client";

import { signOut } from "next-auth/react";
import { FiLogOut } from "react-icons/fi";

export function DashboardSignOut({ className = "dashboard-signout" }: { className?: string }) {
  return (
    <button
      className={className}
      onClick={() => signOut({ redirectTo: "/" })}
      type="button"
    >
      <span className="dashboard-signout-label">Cerrar sesión</span>
      <FiLogOut aria-hidden="true" />
    </button>
  );
}
