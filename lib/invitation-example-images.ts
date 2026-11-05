import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import { landingEventExamples } from "./landing-invitation-example";
import { ACCOUNT_LIMITS } from "./limits";

export function exampleWithImages(example: typeof landingEventExamples[number]) {
  const image = (name: string) => {
    if (!name) return "";
    for (const extension of ["webp", "jpg", "jpeg", "png", "avif"]) {
      const url = `${example.imageFolder}/${name}.${extension}`;
      if (existsSync(path.join(process.cwd(), "public", url))) return url;
    }
    return "";
  };
  const gallery = Array.from({ length: ACCOUNT_LIMITS.imagesPerGallery }, (_, index) => image(`galeria-${index + 1}`)).filter(Boolean);
  return {
    ...example.invitation,
    imageUrl: image("principal") || example.invitation.imageUrl,
    backgroundImageUrl: image("fondo"),
    sections: example.invitation.sections.map(section => ({
      ...section,
      imageUrl: image(({ story: "historia", reception: "lugar", program: "programa", parents: "familias" } as Record<string, string>)[section.type] ?? "") || section.imageUrl,
      ...(section.type === "gallery" && gallery.length ? { imageUrls: gallery, enabled: true } : {}),
    })),
  };
}
