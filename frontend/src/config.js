// Dynamic API Base URL resolver for Local, Docker, and Render cloud deployments
export const API_BASE_URL = (() => {
  // 1. If explicit env variable is provided (Vite build-time or runtime)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 2. Client-side browser runtime check
  if (typeof window !== 'undefined') {
    // Check if user saved a custom API URL override
    const localOverride = window.localStorage.getItem('VITE_API_BASE_URL');
    if (localOverride) return localOverride;

    const host = window.location.hostname;
    // Local development or local docker
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // Render production deployment fallback:
    // Converts 'news-aggregator-frontend-m7pi.onrender.com' -> 'news-aggregator-backend.onrender.com'
    if (host.includes('.onrender.com')) {
      const renderBackendHost = host.replace(/frontend(-[a-z0-9]+)?/i, 'backend');
      return `https://${renderBackendHost}/api`;
    }
  }

  return 'http://localhost:5000/api';
})();
