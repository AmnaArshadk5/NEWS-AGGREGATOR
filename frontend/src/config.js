// Dynamic API Base URL resolver for Local, Docker, and Render cloud deployments
export const API_BASE_URL = (() => {
  // 1. Check localStorage override first
  if (typeof window !== 'undefined') {
    const localOverride = window.localStorage.getItem('VITE_API_BASE_URL');
    if (localOverride) return localOverride;
  }

  // 2. Explicit env variable during build/runtime
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 3. Client-side browser runtime check
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Local development or local docker
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // Render cloud production backend URL
    if (host.includes('.onrender.com')) {
      return 'https://news-aggregator-ac9t.onrender.com/api';
    }
  }

  return 'http://localhost:5000/api';
})();
