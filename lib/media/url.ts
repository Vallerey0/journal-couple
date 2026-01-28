// src/lib/media/url.ts

/**
 * Build public URL for media stored in R2
 * Database ONLY stores relative path (image_path)
 */
export function getPublicMediaUrl(path: string) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_R2_DOMAIN;

  if (!base) {
    throw new Error("NEXT_PUBLIC_R2_DOMAIN is not set");
  }

  // pastikan tidak double slash
  const normalizedBase = base.replace(/\/$/, "");
  const normalizedPath = path.replace(/^\//, "");

  return `${normalizedBase}/${normalizedPath}`;
}
