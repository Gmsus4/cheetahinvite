export function invitationImageUrls(event: { imageUrl?: string | null; backgroundImageUrl?: string | null; sections?: unknown }): string[] {
  const urls = new Set<string>();
  if (event.imageUrl) urls.add(event.imageUrl);
  if (event.backgroundImageUrl) urls.add(event.backgroundImageUrl);
  if (Array.isArray(event.sections)) {
    for (const section of event.sections) {
      if (!section || typeof section !== "object") continue;
      if (typeof section.imageUrl === "string" && section.imageUrl) urls.add(section.imageUrl);
      if (Array.isArray(section.imageUrls)) {
        for (const url of section.imageUrls) if (typeof url === "string" && url) urls.add(url);
      }
    }
  }
  return [...urls];
}
