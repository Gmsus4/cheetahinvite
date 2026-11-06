BEGIN;
LOCK TABLE "Event" IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE "InvitationLink" (
    "path" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    CONSTRAINT "InvitationLink_pkey" PRIMARY KEY ("path"),
    CONSTRAINT "InvitationLink_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "InvitationLink_eventId_idx" ON "InvitationLink"("eventId");

-- Save old account URLs before resolving duplicate public names.
INSERT INTO "InvitationLink" ("path", "eventId")
SELECT '/invitacion/' || "ownerId" || '/' || "customSlug", "id"
FROM "Event" WHERE "customSlug" IS NOT NULL;
INSERT INTO "InvitationLink" ("path", "eventId")
SELECT '/invitacion/' || "slug", "id" FROM "Event" WHERE "slug" IS NOT NULL;
INSERT INTO "InvitationLink" ("path", "eventId")
SELECT '/event/' || "slug", "id" FROM "Event" WHERE "slug" IS NOT NULL;

DO $$
DECLARE
  invitation RECORD;
  candidate TEXT;
  suffix INTEGER;
BEGIN
  FOR invitation IN SELECT "id", "customSlug" FROM "Event"
    WHERE "customSlug" IS NOT NULL ORDER BY "createdAt", "id"
  LOOP
    candidate := invitation."customSlug";
    suffix := 2;
    WHILE EXISTS (SELECT 1 FROM "InvitationLink" WHERE "path" = '/event/' || candidate AND "eventId" <> invitation."id")
      OR (candidate <> invitation."customSlug" AND EXISTS (SELECT 1 FROM "Event" WHERE "customSlug" = candidate AND "id" <> invitation."id"))
    LOOP
      candidate := rtrim(left(invitation."customSlug", 68), '-') || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;
    INSERT INTO "InvitationLink" ("path", "eventId") VALUES ('/event/' || candidate, invitation."id") ON CONFLICT DO NOTHING;
    UPDATE "Event" SET "customSlug" = candidate WHERE "id" = invitation."id";
  END LOOP;
END $$;

COMMIT;
