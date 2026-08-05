// Dynamic API Base URL resolver for Local, Docker, and Render cloud deployments
export const API_BASE_URL = (() => {
  // 1. Check localStorage override first
  if (typeof window !== 'undefined') {
    const localOverride = window.localStorage.getItem('VITE_API_BASE_URL');
    if (localOverride) return localOverride;
  }

  // 2. Client-side browser runtime hostname check (Prioritized for live production serving)
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Render cloud production domain
    if (host.includes('.onrender.com')) {
      return 'https://news-aggregator-ac9t.onrender.com/api';
    }
    // Local development or local Docker
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }

  // 3. Fallback env variable check
  if (import.meta.env && import.meta.env.VITE_API_BASE_URL && !import.meta.env.VITE_API_BASE_URL.includes('localhost')) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  return 'https://news-aggregator-ac9t.onrender.com/api';
})();

export default API_BASE_URL;
