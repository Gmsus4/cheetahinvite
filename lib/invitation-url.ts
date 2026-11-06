export function normalizeInvitationSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function isValidInvitationSlug(value: string) {
  return value.length >= 2 && value.length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function invitationPath(event: { ownerId: string; customSlug?: string | null; slug: string | null }) {
  const slug = event.customSlug || event.slug;
  return slug ? `/event/${encodeURIComponent(slug)}` : null;
}

export function legacyInvitationPath(event: { ownerId: string; customSlug?: string | null; slug: string | null }) {
  if (event.customSlug) return `/invitacion/${encodeURIComponent(event.ownerId)}/${encodeURIComponent(event.customSlug)}`;
  return event.slug ? `/invitacion/${encodeURIComponent(event.slug)}` : null;
}
