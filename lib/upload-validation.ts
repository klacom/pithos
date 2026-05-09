/**
 * File Upload Validation Utility
 * Handles size and MIME type validation for different upload types
 */

// ============================================
// IMAGE UPLOAD VALIDATION
// ============================================

/** Max image file size: 10 MB */
export const MAX_IMAGE_FILE_BYTES = 10 * 1024 * 1024;

/** Allowed image and video MIME types */
export const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
] as const;

/** Allowed media file extensions (lowercase, with dot) */
export const ALLOWED_MEDIA_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4"] as const;

/**
 * Validate media file (image or video)
 * @param file - File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateMediaFile(file: File, maxSize: number = MAX_IMAGE_FILE_BYTES): string | null {
  // Check file size
  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    return `File size exceeds maximum of ${maxMB} MB (current: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
  }

  // Check MIME type
  if (!ALLOWED_MEDIA_TYPES.includes(file.type as any)) {
    return `Invalid file type. Allowed types: JPEG, PNG, WebP, GIF, MP4 (received: ${file.type || "unknown"})`;
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_MEDIA_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return `Invalid file extension. Allowed: ${ALLOWED_MEDIA_EXTENSIONS.join(", ")}`;
  }

  return null;
}

/**
 * Validate image file (Legacy wrapper for backward compatibility)
 */
export function validateImageFile(file: File): string | null {
  return validateMediaFile(file, MAX_IMAGE_FILE_BYTES);
}

/**
 * Validate multiple image files
 * @param files - Files to validate
 * @returns Array of error messages (empty if all valid)
 */
export function validateImageFiles(files: File[]): string[] {
  const errors: string[] = [];
  files.forEach((file, index) => {
    const error = validateImageFile(file);
    if (error) {
      errors.push(`File ${index + 1} (${file.name}): ${error}`);
    }
  });
  return errors;
}

/**
 * Format max image size label for UI
 */
export function formatMaxImageSizeLabel(): string {
  const mb = (MAX_IMAGE_FILE_BYTES / (1024 * 1024)).toFixed(0);
  return `${mb} MB`;
}

// ============================================
// SITE CONTENT IMAGE VALIDATION
// ============================================

/** Max site content image size: 15 MB (slightly larger for banners) */
export const MAX_SITE_CONTENT_IMAGE_BYTES = 15 * 1024 * 1024;

/**
 * Validate site content media (same as media validation but different size limit)
 * @param file - File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateSiteContentImage(file: File): string | null {
  return validateMediaFile(file, MAX_SITE_CONTENT_IMAGE_BYTES);
}

export function formatMaxSiteContentImageSizeLabel(): string {
  const mb = (MAX_SITE_CONTENT_IMAGE_BYTES / (1024 * 1024)).toFixed(0);
  return `${mb} MB`;
}
