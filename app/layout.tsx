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
import "./wedding-designs.css";
import "./wedding-mediterranean.css";
import "./wedding-art-deco.css";
import "./wedding-love-letter.css";
import "./wedding-starlight.css";
import "./wedding-identities.css";
import "./guided-editor.css";
import "./wedding-gallery.css";
import "./wedding-collection.css";
import "./wedding-collection-covers.css";
import "./wedding-collection-interiors.css";
import "./site-typography.css";
import "./birthday-confetti.css";
import "./birthday-pastel.css";
import "./birthday-neon.css";
import "./birthday-disco.css";

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

import "./birthday-space.css";
import "./birthday-dinosaur.css";

import "./birthday-gamer.css";

import "./birthday-cowboy.css";

import "./birthday-elegant.css";

import "./birthday-cinema.css";
