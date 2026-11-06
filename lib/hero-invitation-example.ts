import "server-only";
import { exampleWithImages } from "./invitation-example-images";
import { landingEventExamples } from "./landing-invitation-example";
import { heroPreviewImages } from "./hero-preview-images";

export function heroExampleWithImages(example: typeof landingEventExamples[number]) {
  const invitation = exampleWithImages(example);
  const image = (url: string) => heroPreviewImages[url] ?? url;
  return {
    ...invitation,
    imageUrl: image(invitation.imageUrl),
    backgroundImageUrl: image(invitation.backgroundImageUrl),
    sections: invitation.sections.map(section => ({
      ...section, imageUrl: image(section.imageUrl), imageUrls: section.imageUrls?.map(image),
    })),
  };
}
