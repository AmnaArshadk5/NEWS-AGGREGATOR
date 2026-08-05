// Dynamic API Base URL resolver for Local, Docker, and Render cloud deployments
export const API_BASE_URL = (() => {
  // 1. If explicit env variable is provided (Vite build-time or runtime)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 2. Client-side browser runtime check
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Local development or local docker
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // Render production deployment fallback:
    // Derives backend domain from frontend domain (e.g. news-aggregator-frontend... -> news-aggregator-backend...)
    if (host.includes('.onrender.com')) {
      const renderBackendHost = host.replace('frontend', 'backend');
      return `https://${renderBackendHost}/api`;
    }
  }

  return 'http://localhost:5000/api';
})();
