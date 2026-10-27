export const ACCOUNT_LIMITS = {
  invitations: 3,
  imagesPerGallery: 12,
  imageSizeBytes: 5 * 1024 * 1024,
  imageUploadsPerHour: 20,
  imageUploadsPerDay: 60,
  storedImagesPerEvent: 40,
  imageStorageBytesPerEvent: 100 * 1024 * 1024,
  temporaryImageHours: 24,
} as const;

