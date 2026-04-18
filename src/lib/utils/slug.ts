/**
 * Normalizes a string into a URL-safe slug while preserving native UTF-8 characters 
 * like German umlauts (ä, ö, ü, ß).
 */
export function normalizeSlug(text: string): string {
  if (!text) return ''

  return text
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    // We allow: a-z, 0-9, German umlauts (äöüß) and already existing hyphens
    .replace(/[^a-z0-9äöüß-]/g, '-')
    // Collapse consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/(^-|-$)/g, '')
}
