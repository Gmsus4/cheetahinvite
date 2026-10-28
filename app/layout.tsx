import type { Metadata } from "next";
import "./globals.css";
import "./invitation-fonts.css";
import "./wedding-editorial.css";
import "./event-workspace.css";
import "./dashboard-workspace.css";
import "./workspace-controls.css";
import "./invitation-sections.css";
import "./invitation-decorations.css";
import "./invitation-textures.css";
import "./invitation-system.css";
import "./invitation-rsvp.css";
import "./invitation-motion.css";

export const metadata: Metadata = {
  title: "Cheetah Invite — Invitaciones digitales para celebrar",
  description:
    "Crea una invitación digital única y comparte los detalles de tu celebración. Diseños para bodas, cumpleaños, graduaciones y más.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
