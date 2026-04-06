export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Safely resolves a media URL from the backend.
 * - Returns absolute URLs (http://, https://, data:) as-is.
 * - Prepends the API_BASE for relative paths (e.g., /media/...).
 */
export const getMediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // If the URL is already absolute or a data URL, return it as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  // Otherwise, prepend the API_BASE. Ensure no double slashes.
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const path = url.startsWith('/') ? url : `/${url}`;
  
  return `${base}${path}`;
};
