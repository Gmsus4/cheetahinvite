import type { Metadata } from "next";
import { ThemeScript, ThemeSync } from "@/components/ThemeToggle";
import "./globals.css";
import "./invitation-fonts.css";
import "./event-workspace.css";
import "./dashboard-workspace.css";
import "./workspace-controls.css";
import "./invitation-rsvp.css";
import "./invitation-motion.css";
import "./guided-editor.css";
import "./invitation-atmosphere.css";
import "./site-typography.css";
import "./theme.css";

export const metadata: Metadata = {
  title: "Cheetah Invite — Invitaciones digitales para celebrar",
  description:
    "Crea tu invitación digital para bodas, cumpleaños, graduaciones y más. Personaliza tus fotos, colores y los detalles de tu celebración.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased" data-theme="light" suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body className="min-h-full flex flex-col"><ThemeSync />{children}</body>
    </html>
  );
}
