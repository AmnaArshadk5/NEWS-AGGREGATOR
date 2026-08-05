import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { 
  Users, FolderTree, BarChart3, Shield, Trash2, 
  UserCheck, UserX, Plus, Power, Loader2, Search,
  TrendingUp, Activity, LogOut, Sun, Moon
} from 'lucide-react';

export default function AdminPanel({ onCategoriesUpdated }) {
  const { token, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');

  // Night Mode / Dark Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('news_app_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('news_app_theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('news_app_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Users State
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Categories State
  const [categoriesList, setCategoriesList] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');

  // Stats State
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Common Notification/Error State
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchCategories();
      fetchStats();
    }
  }, [token]);

  // --- FETCH HELPERS ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategoriesList(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // --- USER ACTIONS ---
  const handleDeleteUser = async (targetId, targetName) => {
    if (targetId === user?.id) {
      alert('You cannot delete your own admin account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user "${targetName}" and all their saved bookmarks?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${targetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsersList(prev => prev.filter(u => u.id !== targetId));
      fetchStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRole = async (targetId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    if (targetId === user?.id && newRole !== 'admin') {
      alert('You cannot demote your own admin account.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${targetId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user role');
      }

      setUsersList(prev => prev.map(u => u.id === targetId ? { ...u, role: newRole } : u));
      fetchStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // --- CATEGORY ACTIONS ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatSlug.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCatName, slug: newCatSlug })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add category');
      }

      setCategoriesList(prev => [...prev, data.category]);
      setNewCatName('');
      setNewCatSlug('');
      if (onCategoriesUpdated) onCategoriesUpdated();
      fetchStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCategory = async (catId, currentEnabled) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories/${catId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: !currentEnabled })
      });

      if (res.ok) {
        setCategoriesList(prev => prev.map(c => c.id === catId ? { ...c, enabled: !currentEnabled ? 1 : 0 } : c));
        if (onCategoriesUpdated) onCategoriesUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Delete category "${catName}"?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories/${catId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setCategoriesList(prev => prev.filter(c => c.id !== catId));
        if (onCategoriesUpdated) onCategoriesUpdated();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const tabs = [
    { id: 'stats', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'users', label: 'Users', icon: <Users size={16} />, count: usersList.length },
    { id: 'categories', label: 'Categories', icon: <FolderTree size={16} />, count: categoriesList.length },
  ];

  return (
    <div style={styles.pageWrapper}>

      {/* ===== TOP NAVIGATION BAR ===== */}
      <header className="admin-top-bar" style={styles.topBar}>
        <div className="admin-top-bar-inner" style={styles.topBarInner}>
          {/* Brand */}
          <div className="admin-brand" style={styles.brand}>
            <div style={styles.brandIcon}>
              <Shield size={18} color="#fff" />
            </div>
            <div>
              <span style={styles.brandText}>The Daily</span>
              <span style={styles.brandAccent}>Wire</span>
              <span style={styles.adminTag}>Admin</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="admin-tab-nav" style={styles.tabNav}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={activeTab === tab.id ? { ...styles.tabBtn, ...styles.tabBtnActive } : styles.tabBtn}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={activeTab === tab.id ? { ...styles.tabCount, ...styles.tabCountActive } : styles.tabCount}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* User + Sign Out */}
          <div className="admin-top-bar-right" style={styles.topBarRight}>
            <button
              onClick={toggleTheme}
              style={{
                ...styles.signOutBtn,
                backgroundColor: isDarkMode ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                color: isDarkMode ? '#fbbf24' : 'var(--text-secondary)',
                border: '1px solid var(--border-light)',
                marginRight: '8px'
              }}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Night Mode'}
            >
              {isDarkMode ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="var(--text-secondary)" />}
              <span>{isDarkMode ? 'Day' : 'Night'}</span>
            </button>

            <div style={styles.userPill}>
              <div style={styles.avatar}>
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span style={styles.userName}>{user?.username}</span>
            </div>
            <button onClick={logout} style={styles.signOutBtn}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
        {/* Accent line */}
        <div style={styles.accentLine} />
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main style={styles.mainContent}>
        <div style={styles.contentContainer}>

          {/* Page Title */}
          <header style={styles.contentHeader}>
            <h1 style={styles.pageTitle}>
              {activeTab === 'stats' && 'System Overview'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'categories' && 'Category Controls'}
            </h1>
          </header>

          {/* Tab: Stats */}
          {activeTab === 'stats' && (
            <div style={styles.fadeEnter}>
              {loadingStats || !stats ? (
                <div style={styles.loadingBox}>
                  <Loader2 className="spinner" size={28} color="var(--accent-primary)" />
                  <p>Aggregating data...</p>
                </div>
              ) : (
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statIconBadge}><Users size={20} color="var(--accent-primary)" /></div>
                    <span style={styles.statNumber}>{stats.totalUsers}</span>
                    <span style={styles.statLabel}>Total Users</span>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIconBadge}><Shield size={20} color="var(--accent-primary)" /></div>
                    <span style={styles.statNumber}>{stats.totalAdmins}</span>
                    <span style={styles.statLabel}>Administrators</span>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIconBadge}><Activity size={20} color="var(--accent-primary)" /></div>
                    <span style={styles.statNumber}>{stats.totalBookmarks}</span>
                    <span style={styles.statLabel}>Saved Articles</span>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIconBadge}><TrendingUp size={20} color="var(--accent-primary)" /></div>
                    <span style={styles.statNumber}>{stats.activeCategories}</span>
                    <span style={styles.statLabel}>Active Categories</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Users */}
          {activeTab === 'users' && (
            <div style={styles.fadeEnter}>
              <div style={styles.toolbar}>
                <div style={styles.searchBar}>
                  <Search size={16} color="var(--text-muted)" style={styles.searchIcon} />
                  <input 
                    type="text"
                    placeholder="Search users by name..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="input-field"
                    style={styles.searchInput}
                  />
                </div>
              </div>

              {loadingUsers ? (
                <div style={styles.loadingBox}>
                  <Loader2 className="spinner" size={28} color="var(--accent-primary)" />
                </div>
              ) : (
                <div style={styles.tableCard}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th>User Profile</th>
                        <th>Role</th>
                        <th>Saved Articles</th>
                        <th>Joined</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, i) => (
                        <tr key={u.id} style={{ ...styles.tableRow, animationDelay: `${i * 0.05}s` }} className="admin-tr">
                          <td>
                            <div style={styles.userCell}>
                              <div style={styles.avatarMini}>{u.username.charAt(0).toUpperCase()}</div>
                              <div>
                                <span style={styles.usernameText}>{u.username}</span>
                                {u.id === user?.id && <span style={styles.youBadge}> (You)</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              ...styles.roleBadge,
                              backgroundColor: u.role === 'admin' ? 'rgba(136, 19, 55, 0.08)' : 'var(--bg-input)',
                              color: u.role === 'admin' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                            }}>
                              {u.role ? u.role.toUpperCase() : 'USER'}
                            </span>
                          </td>
                          <td style={styles.mutedText}>{u.bookmark_count || 0} items</td>
                          <td style={styles.mutedText}>{new Date(u.created_at).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={styles.actionBtns}>
                              <button
                                onClick={() => handleToggleRole(u.id, u.role)}
                                disabled={u.id === user?.id || actionLoading}
                                className="btn btn-secondary"
                                style={styles.miniBtn}
                                title={u.role === 'admin' ? "Demote to User" : "Promote to Admin"}
                              >
                                {u.role === 'admin' ? <UserX size={14} /> : <UserCheck size={14} />}
                                <span>{u.role === 'admin' ? 'Demote' : 'Promote'}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                disabled={u.id === user?.id || actionLoading}
                                style={styles.deleteBtn}
                                title="Delete user"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan="5" style={styles.emptyState}>
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Categories */}
          {activeTab === 'categories' && (
            <div style={styles.fadeEnter}>
              <div style={styles.addCategoryCard}>
                <div>
                  <h4 style={styles.cardTitle}>Add New Category</h4>
                  <p style={styles.cardSubtitle}>Extend the news feed with custom search queries.</p>
                </div>
                <form onSubmit={handleAddCategory} style={styles.formRow}>
                  <input 
                    type="text"
                    placeholder="Name (e.g. Finance)"
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }}
                    className="input-field"
                    style={styles.flexInput}
                    required
                  />
                  <input 
                    type="text"
                    placeholder="Slug (e.g. finance)"
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    className="input-field"
                    style={styles.flexInput}
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ flexShrink: 0, padding: '0 24px' }}>
                    <Plus size={16} />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              {loadingCategories ? (
                <div style={styles.loadingBox}>
                  <Loader2 className="spinner" size={28} color="var(--accent-primary)" />
                </div>
              ) : (
                <div style={styles.categoriesGrid}>
                  {categoriesList.map((cat, i) => (
                    <div key={cat.id} style={{ ...styles.categoryCard, animationDelay: `${i * 0.05}s` }} className="admin-card">
                      <div style={styles.catInfo}>
                        <span style={styles.catName}>{cat.name}</span>
                        <span style={styles.catSlug}>/{cat.slug}</span>
                      </div>
                      <div style={styles.catActions}>
                        <button
                          onClick={() => handleToggleCategory(cat.id, cat.enabled)}
                          style={{
                            ...styles.statusBtn,
                            backgroundColor: cat.enabled ? 'rgba(22, 101, 52, 0.08)' : 'var(--bg-input)',
                            color: cat.enabled ? 'var(--accent-success)' : 'var(--text-muted)'
                          }}
                        >
                          <Power size={13} />
                          <span>{cat.enabled ? 'Active' : 'Hidden'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          style={styles.deleteBtn}
                          title="Delete category"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        th, td {
          text-align: left;
          padding: 16px 20px;
        }
        th:last-child, td:last-child {
          text-align: right;
        }
        th {
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-light);
        }

        .admin-tr {
          animation: fadeUp 0.3s ease forwards;
          opacity: 0;
        }
        .admin-tr:hover {
          background-color: rgba(0,0,0,0.015);
        }
        .admin-card {
          animation: fadeUp 0.3s ease forwards;
          opacity: 0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .admin-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },

  // ===== TOP BAR =====
  topBar: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'var(--bg-nav)',
    borderBottom: '1px solid var(--border-light)',
  },
  topBarInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 28px',
    height: '60px',
    gap: '24px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  brandIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, var(--accent-primary) 0%, #680e2a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  brandAccent: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--accent-primary)',
    marginLeft: '4px',
  },
  adminTag: {
    marginLeft: '8px',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(136, 19, 55, 0.08)',
    color: 'var(--accent-primary)',
    fontSize: '0.7rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tabNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    height: '100%',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.88rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  },
  tabBtnActive: {
    background: 'linear-gradient(135deg, var(--accent-primary) 0%, #680e2a 100%)',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(136, 19, 55, 0.2)',
  },
  tabCount: {
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-muted)',
    padding: '1px 7px',
    borderRadius: '20px',
    fontSize: '0.72rem',
    fontWeight: '700',
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 12px 4px 4px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-card)',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-secondary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.78rem',
    fontWeight: '700',
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  signOutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-light)',
    background: 'transparent',
    color: '#ef4444',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  accentLine: {
    height: '3px',
    background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-warm) 50%, var(--accent-primary) 100%)',
    opacity: 0.85,
  },

  // ===== MAIN CONTENT =====
  mainContent: {
    flex: 1,
    padding: '0 0 48px',
  },
  contentContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 28px',
  },
  contentHeader: {
    padding: '32px 0 24px',
  },
  pageTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  fadeEnter: {
    animation: 'fadeUp 0.4s ease forwards',
  },

  // ===== STATS =====
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px',
  },
  statCard: {
    padding: '28px 24px',
    borderRadius: '16px',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-card)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
  },
  statIconBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: 'rgba(136, 19, 55, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  statNumber: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    fontFamily: "'Lora', serif",
    lineHeight: 1,
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },

  // ===== USERS =====
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  searchBar: {
    position: 'relative',
    width: '300px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  searchInput: {
    paddingLeft: '38px',
    width: '100%',
    borderRadius: '20px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-light)',
  },
  tableCard: {
    borderRadius: '12px',
    border: '1px solid var(--border-light)',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-card)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  tableRow: {
    borderBottom: '1px solid var(--border-light)',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '4px 0',
  },
  avatarMini: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: '700',
  },
  usernameText: {
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  youBadge: {
    fontSize: '0.75rem',
    color: 'var(--accent-primary)',
    fontWeight: '700',
  },
  roleBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.03em',
  },
  mutedText: {
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  actionBtns: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  miniBtn: {
    height: '32px',
    padding: '0 12px',
    fontSize: '0.8rem',
    borderRadius: '8px',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },

  // ===== CATEGORIES =====
  addCategoryCard: {
    padding: '24px',
    backgroundColor: 'var(--bg-input)',
    borderRadius: '16px',
    border: '1px dashed var(--border-light)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  cardSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  flexInput: {
    flex: 1,
    borderRadius: '8px',
    border: '1px solid var(--border-light)',
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  categoryCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderRadius: '12px',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-card)',
  },
  catInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  catName: {
    fontWeight: '700',
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
  },
  catSlug: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
  },
  catActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    border: 'none',
    fontSize: '0.78rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },

  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    gap: '16px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
};
