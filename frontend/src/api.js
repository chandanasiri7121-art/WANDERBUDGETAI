// A relative path keeps Vite's local development proxy working.  Production
// deployments set VITE_API_BASE_URL to the HTTPS origin of the API.
const configuredBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

export function apiUrl(path) {
  if (typeof path !== 'string' || !path.startsWith('/api/')) {
    throw new Error('API requests must use an /api/ path');
  }
  return configuredBaseUrl ? `${configuredBaseUrl}${path}` : path;
}

export function apiFetch(path, options) {
  return globalThis.fetch(apiUrl(path), options);
}
