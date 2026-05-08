/** Match `assets_storage` bucket limits in Supabase (raise the bucket limit if you need larger archives). */
export const MAX_PACKAGE_FILE_BYTES = 50 * 1024 * 1024;

/** Allowed downloadable asset package extensions (lowercase, with dot). */
export const ALLOWED_PACKAGE_EXTENSIONS = [
  ".zip",
  ".blend",
  ".fbx",
  ".obj",
  ".gltf",
  ".glb",
  ".rar",
  ".7z",
  ".max",
  ".ma",
  ".mb",
  ".dae",
  ".stl",
] as const;

const ACCEPT_ATTR = ALLOWED_PACKAGE_EXTENSIONS.join(",");

export function packageFileAcceptAttribute(): string {
  return ACCEPT_ATTR;
}

export function getPackageExtensionLower(fileName: string): string | null {
  const lower = fileName.trim().toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot < 0) return null;
  return lower.slice(dot);
}

export function isAllowedPackageFileName(fileName: string): boolean {
  const ext = getPackageExtensionLower(fileName);
  if (!ext) return false;
  return (ALLOWED_PACKAGE_EXTENSIONS as readonly string[]).includes(ext);
}

export function isAllowedPackageFile(file: File): boolean {
  return isAllowedPackageFileName(file.name);
}

export function formatMaxPackageSizeLabel(): string {
  const mb = MAX_PACKAGE_FILE_BYTES / (1024 * 1024);
  return `${mb} MB`;
}
