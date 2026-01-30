/**
 * API Configuration
 * Determines the API base URL based on environment
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://api.inchagram.com'
    : '');

/**
 * Helper function to construct API URLs
 */
export function apiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}
