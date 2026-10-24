import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cheetah Invite — Invitaciones digitales para celebrar",
  description:
    "Crea una invitación digital única, compártela con tus invitados y disfruta cada respuesta. Diseños para bodas, cumpleaños, graduaciones y más.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
