ALTER TABLE "User" ADD COLUMN "invitationCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Event" ADD COLUMN "imageUploads" INTEGER NOT NULL DEFAULT 0;

UPDATE "User" AS u
SET "invitationCount" = (
  SELECT COUNT(*)::INTEGER FROM "Event" AS e WHERE e."ownerId" = u."id"
);

UPDATE "Event" AS e
SET "imageUploads" = (
  SELECT COUNT(DISTINCT image_url)::INTEGER
  FROM (
    SELECT NULLIF(e."imageUrl", '') AS image_url
    UNION ALL
    SELECT NULLIF(section->>'imageUrl', '')
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(e."sections") = 'array' THEN e."sections" ELSE '[]'::jsonb END
    ) AS event_sections(section)
    UNION ALL
    SELECT NULLIF(gallery_image, '')
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(e."sections") = 'array' THEN e."sections" ELSE '[]'::jsonb END
    ) AS event_sections(section)
    CROSS JOIN LATERAL jsonb_array_elements_text(
      CASE WHEN jsonb_typeof(section->'imageUrls') = 'array' THEN section->'imageUrls' ELSE '[]'::jsonb END
    ) AS gallery(gallery_image)
  ) AS event_images
  WHERE image_url IS NOT NULL
);
