import type { WeddingDesign } from "./wedding-designs";

type IdentityArtwork = Partial<Record<"topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "flower" | "decoration" | "texture", string>>;

// Replacement artwork belongs to edition 2 only. Keep original template files intact.
// Add supplied files under public/wedding-identities/<kind>/ and point the relevant
// slot here, e.g. floral: { topLeft: "/wedding-identities/floral/arch.png" }.
// Unspecified slots continue using the owner's existing illustrations.
export const weddingIdentityAssets: Partial<Record<WeddingDesign["kind"], IdentityArtwork>> = {};
