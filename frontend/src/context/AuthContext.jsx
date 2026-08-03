import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('news_auth_token') || null);
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate stored token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // Fetch user bookmarks
          fetchBookmarks(token);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Error verifying token:', err);
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

      localStorage.setItem('news_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      fetchBookmarks(data.token);
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    }
  };

  const register = async (username, password) => {
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('news_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setBookmarks([]); // New user has no bookmarks
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('news_auth_token');
    setToken(null);
    setUser(null);
    setBookmarks([]);
    setAuthError(null);
  };

  const toggleBookmark = async (article) => {
    if (!user) {
      return { success: false, requireAuth: true };
    }

    const isExisting = bookmarks.some(b => b.url === article.url);

    try {
      if (isExisting) {
        // Remove bookmark
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
        // Add bookmark
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
          // Add locally to state
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
      loading,
      login,
      register,
      logout,
      toggleBookmark,
      isBookmarked,
      setAuthError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
