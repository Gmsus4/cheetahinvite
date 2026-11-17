import "server-only";
import { createHash } from "node:crypto";
import type { InvitationProps } from "./invitation-editor";
import { demoPreviewImages } from "./demo-preview-images";

export type DemoPreview = { contentKey: string; key: string; webp: string };
type PublishedInvitation = InvitationProps & { demoPreview?: DemoPreview };

export function withoutDemoPreview(invitation: InvitationProps): InvitationProps {
  const { demoPreview: _preview, ...content } = invitation as PublishedInvitation;
  void _preview;
  return content;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}

export function demoPreviewKey(invitation: InvitationProps) {
  return createHash("sha256").update(JSON.stringify(canonical(withoutDemoPreview(invitation)))).update("demo-screen-390x830-v1").digest("hex").slice(0, 24);
}

export function readDemoPreview(invitation: InvitationProps): DemoPreview | null {
  const preview = (invitation as PublishedInvitation).demoPreview;
  if (!preview || preview.contentKey !== demoPreviewKey(invitation) || !/^[a-f0-9]{24}$/.test(preview.key)
    || typeof preview.webp !== "string" || preview.webp.length > 700_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(preview.webp)) return null;
  return preview;
}

export function createDemoPreview(invitation: InvitationProps, image: Uint8Array): DemoPreview {
  if (!image.length || image.length > 500_000) throw new Error("Invalid demo capture size");
  return { contentKey: demoPreviewKey(invitation), key: createHash("sha256").update(image).digest("hex").slice(0, 24), webp: Buffer.from(image).toString("base64") };
}

export function demoPreviewImage(invitation: InvitationProps, slug?: string) {
  const preview = readDemoPreview(invitation);
  if (preview && slug) return `/api/demo-previews/${encodeURIComponent(slug)}/${preview.key}`;
  return demoPreviewImages[demoPreviewKey(invitation)] ?? null;
}
