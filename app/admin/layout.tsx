import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-access";
import { AdminShell } from "@/components/admin/AdminShell";
import { BrandLoader } from "@/components/BrandLoader";
import "./admin.css";

export const metadata: Metadata = { title: { default: "Administración | Cheetah Invite", template: "%s | Administración" }, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<BrandLoader message="Preparando tu administración…" />}><AdminAccess>{children}</AdminAccess></Suspense>;
}

async function AdminAccess({ children }: { children: React.ReactNode }) {
  const account = await requireAdmin();
  return <AdminShell account={account}>{children}</AdminShell>;
}
