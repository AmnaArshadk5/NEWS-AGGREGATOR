import React, { createContext, useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext(null);

// Decode JWT payload without a library — just base64 decode the middle part
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // treat malformed tokens as expired
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      localStorage.removeItem('news_auth_token'); // Wipe legacy persistent localStorage token
      return sessionStorage.getItem('news_auth_token') || null;
    } catch {
      return null;
    }
  });
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [sessionNotice, setSessionNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate stored token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      // 1. Check expiry client-side first — avoids a 403 network request entirely
      if (isTokenExpired(token)) {
        sessionStorage.removeItem('news_auth_token');
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // 2. Token looks valid — confirm with the server
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          fetchBookmarks(token);
        } else {
          // Server rejected it (e.g. JWT_SECRET changed) — clear silently
          localStorage.removeItem('news_auth_token');
          setToken(null);
          setUser(null);
        }
      } catch {
        // Silent catch for token verification network failure
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const fetchBookmarks = async (authToken) => {
    const activeToken = authToken || token;
    if (!activeToken) return;

    setIsLoadingBookmarks(true);
    try {
      const response = await fetch(`${API_BASE_URL}/bookmarks`, {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBookmarks(data);
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    } finally {
      setIsLoadingBookmarks(false);
    }
  };

  const login = async (username, password) => {
    setAuthError(null);
    setSessionNotice(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      sessionStorage.setItem('news_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      fetchBookmarks(data.token);
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    }
  };

  const register = async (username, password, extraFields = {}) => {
    setAuthError(null);
    setSessionNotice(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          firstName: extraFields.firstName,
          email: extraFields.email,
          contactNumber: extraFields.contactNumber
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      sessionStorage.setItem('news_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setBookmarks([]);
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    }
  };

  const logout = (noticeReason = null) => {
    sessionStorage.removeItem('news_auth_token');
    localStorage.removeItem('news_auth_token');
    setToken(null);
    setUser(null);
    setBookmarks([]);
    setAuthError(null);
    if (noticeReason) {
      setSessionNotice(noticeReason);
    }
  };

  const toggleBookmark = async (article) => {
    if (!user) {
      return { success: false, requireAuth: true };
    }

    const isExisting = bookmarks.some(b => b.url === article.url);

    try {
      if (isExisting) {
        const response = await fetch(`${API_BASE_URL}/bookmarks`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ url: article.url })
        });

        if (response.ok) {
          setBookmarks(prev => prev.filter(b => b.url !== article.url));
          return { success: true, action: 'removed' };
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/bookmarks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: article.title,
            description: article.description,
            url: article.url,
            urlToImage: article.urlToImage,
            publishedAt: article.publishedAt,
            sourceName: article.source?.name || 'Unknown',
            author: article.author || ''
          })
        });

        if (response.ok) {
          const newBookmark = {
            title: article.title,
            description: article.description,
            url: article.url,
            url_to_image: article.urlToImage,
            published_at: article.publishedAt,
            source_name: article.source?.name || 'Unknown',
            author: article.author || ''
          };
          setBookmarks(prev => [newBookmark, ...prev]);
          return { success: true, action: 'added' };
        }
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
    return { success: false };
  };

  const isBookmarked = (url) => {
    return bookmarks.some(b => b.url === url);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      bookmarks,
      isLoadingBookmarks,
      authError,
      sessionNotice,
      loading,
      login,
      register,
      logout,
      toggleBookmark,
      isBookmarked,
      setAuthError,
      setSessionNotice
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
