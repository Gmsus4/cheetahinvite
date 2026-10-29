import type { Metadata } from "next";
import { WeddingDesignGallery } from "@/components/invitation/WeddingDesignGallery";

export const metadata: Metadata = { title: "Colección de bodas | Cheetah Invite", description: "Doce formas de contar su historia. Explora nuestras invitaciones completas de boda." };

export default function WeddingDesignGalleryPage() {
  return <WeddingDesignGallery />;
}
