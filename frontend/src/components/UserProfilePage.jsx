import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  User, Shield, KeyRound, LogOut, Bookmark, BookOpen,
  Rss, Check, Plus, ArrowLeft, ExternalLink, Sparkles, Newspaper,
  Mail, Phone, Bell, Tag
} from 'lucide-react';

const CATEGORY_LIST = ['Food', 'Technology', 'Business', 'Entertainment', 'Sports', 'Health', 'Science'];

export default function UserProfilePage({
  onGoHome,
  onOpenChangePassword,
  onSelectChannel,
  progressCount = 0
}) {
  const { user, logout, bookmarks } = useAuth();
  const { followedChannels, toggleFollowChannel, favoriteCategories, toggleFavoriteCategory, isCategoryFavorite } = useNotifications();

  const username = user?.username || 'User';
  const firstName = user?.firstName || user?.first_name || '';
  const email = user?.email || '';
  const contactNumber = user?.contactNumber || user?.contact_number || '';
  const role = user?.role ? user.role.toUpperCase() : 'MEMBER';
  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Active Member';

  return (
    <div style={styles.container}>
      {/* Back Navigation Bar */}
      <div style={styles.backBar}>
        <button onClick={onGoHome} style={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Back to Feed</span>
        </button>
      </div>

      {/* User Hero Profile Card */}
      <div style={styles.profileHero}>
        <div style={styles.heroInner}>
          <div style={styles.avatarWrap}>
            <div style={styles.avatar}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div style={styles.onlineStatus} title="Online" />
          </div>

          <div style={styles.userDetails}>
            <div style={styles.nameRow}>
              <h1 style={styles.usernameText}>{firstName ? `${firstName} (@${username})` : username}</h1>
              <span style={role === 'ADMIN' ? styles.adminBadge : styles.memberBadge}>
                {role === 'ADMIN' && <Shield size={12} />}
                <span>{role}</span>
              </span>
            </div>

            {/* Extended User Info Row */}
            <div style={styles.contactRow}>
              {email && (
                <span style={styles.contactInfoTag}>
                  <Mail size={13} color="var(--accent-primary)" />
                  <span>{email}</span>
                </span>
              )}
              {contactNumber && (
                <span style={styles.contactInfoTag}>
                  <Phone size={13} color="var(--accent-primary)" />
                  <span>{contactNumber}</span>
                </span>
              )}
              <span style={styles.contactInfoTag}>
                <span>Joined {joinedDate}</span>
              </span>
            </div>

            {/* Quick Stats Tags */}
            <div style={styles.statsRow}>
              <div style={styles.statTag}>
                <Rss size={14} color="var(--accent-primary)" />
                <span><strong>{followedChannels.length}</strong> Following</span>
              </div>
              <div style={styles.statTag}>
                <Bookmark size={14} color="var(--accent-primary)" />
                <span><strong>{bookmarks.length}</strong> Saved</span>
              </div>
              <div style={styles.statTag}>
                <BookOpen size={14} color="var(--accent-primary)" />
                <span><strong>{progressCount}</strong> Reading</span>
              </div>
            </div>
          </div>

          <div style={styles.heroActions}>
            <button onClick={onOpenChangePassword} style={styles.actionBtn}>
              <KeyRound size={15} color="var(--accent-primary)" />
              <span>Change Password</span>
            </button>
            <button onClick={logout} style={styles.logoutBtn}>
              <LogOut size={15} color="#ef4444" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── FAVORITE CATEGORIES NOTIFICATIONS SECTION ── */}
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitleRow}>
          <Bell size={20} color="var(--accent-primary)" />
          <h2 style={styles.sectionTitle}>Favorite Category Notifications</h2>
        </div>
        <p style={styles.sectionSubtitle}>
          Select your favorite categories (e.g. <strong>Food</strong>, <strong>Technology</strong>) to receive live breaking news alerts whenever new articles arrive.
        </p>
        <div style={styles.categoryPillsWrap}>
          {CATEGORY_LIST.map((cat) => {
            const active = isCategoryFavorite(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleFavoriteCategory(cat)}
                style={{
                  ...styles.catPill,
                  backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-input)',
                  color: active ? '#ffffff' : 'var(--text-primary)',
                  borderColor: active ? 'var(--accent-primary)' : 'var(--border-light)',
                }}
                title={active ? `Disable notifications for ${cat}` : `Enable notifications for ${cat}`}
              >
                {active ? <Check size={14} /> : <Plus size={14} />}
                <span>{cat} Alerts</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MY FOLLOWED CHANNELS SECTION ── */}
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitleRow}>
          <Rss size={20} color="var(--accent-primary)" />
          <h2 style={styles.sectionTitle}>My Followed Channels</h2>
          <span style={styles.countBadge}>{followedChannels.length}</span>
        </div>
        <p style={styles.sectionSubtitle}>
          Manage your subscribed news channels and view their dedicated article feeds.
        </p>
      </div>

      {followedChannels.length === 0 ? (
        <div style={styles.emptyCard}>
          <Rss size={48} color="var(--text-muted)" style={{ opacity: 0.4 }} />
          <h3 style={styles.emptyTitle}>You aren't following any channels yet</h3>
          <p style={styles.emptyText}>
            Click the <strong>+ Follow</strong> button on any article's publisher badge to receive live alerts and build your personal news feed.
          </p>
          <button onClick={onGoHome} style={styles.browseBtn}>
            <Newspaper size={16} />
            <span>Explore Headlines</span>
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {followedChannels.map((channelName) => (
            <div key={channelName} style={styles.channelCard}>
              <div style={styles.cardHeader}>
                <div style={styles.channelAvatar}>
                  {channelName.charAt(0).toUpperCase()}
                </div>
                <div style={styles.channelInfo}>
                  <h3 style={styles.channelName}>{channelName}</h3>
                  <span style={styles.channelTag}>
                    <Sparkles size={11} color="var(--accent-primary)" />
                    <span>Subscribed Feed</span>
                  </span>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <button
                  onClick={() => toggleFollowChannel(channelName)}
                  style={styles.followingBtn}
                  title={`Unfollow ${channelName}`}
                >
                  <Check size={14} color="var(--accent-primary)" />
                  <span>Following</span>
                </button>

                <button
                  onClick={() => onSelectChannel && onSelectChannel(channelName)}
                  style={styles.viewChannelBtn}
                  title={`View ${channelName} channel page`}
                >
                  <span>View Channel</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 16px 60px',
  },
  backBar: {
    marginBottom: '16px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    padding: '4px 0',
  },
  profileHero: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-sm)',
    padding: '28px 24px',
    marginBottom: '32px',
  },
  heroInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    flexWrap: 'wrap',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: '68px',
    height: '68px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    color: '#ffffff',
    fontSize: '1.9rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    border: '2px solid var(--bg-card)',
  },
  userDetails: {
    flex: 1,
    minWidth: '240px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  usernameText: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  adminBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: '#ef4444',
    fontSize: '0.72rem',
    fontWeight: '800',
    letterSpacing: '0.05em',
  },
  memberBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: '12px',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    color: 'var(--accent-primary)',
    fontSize: '0.72rem',
    fontWeight: '800',
    letterSpacing: '0.05em',
  },
  contactRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '6px',
    marginBottom: '12px',
  },
  contactInfoTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
  },
  categoryPillsWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '12px',
    marginBottom: '28px',
  },
  catPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid var(--border-light)',
    fontSize: '0.84rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  joinedText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
    marginBottom: '12px',
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  statTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-input)',
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
  },
  heroActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  logoutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.05)',
    color: '#ef4444',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  sectionHeader: {
    marginBottom: '20px',
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sectionTitle: {
    fontSize: '1.3rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    margin: 0,
  },
  countBadge: {
    backgroundColor: 'var(--accent-primary)',
    color: '#ffffff',
    fontSize: '0.78rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  sectionSubtitle: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  channelCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '14px',
    border: '1px solid var(--border-light)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '16px',
    boxShadow: 'var(--shadow-sm)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  channelAvatar: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    color: '#ffffff',
    fontSize: '1.3rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  channelInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  channelName: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  channelTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.75rem',
    color: 'var(--accent-primary)',
    fontWeight: '600',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    paddingTop: '12px',
    borderTop: '1px solid var(--border-light)',
  },
  followingBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--accent-primary)',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    color: 'var(--accent-primary)',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  viewChannelBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  emptyCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    border: '1px solid var(--border-light)',
    padding: '50px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  emptyTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  emptyText: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    maxWidth: '440px',
    margin: 0,
    lineHeight: 1.4,
  },
  browseBtn: {
    marginTop: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 22px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--accent-primary)',
    color: '#ffffff',
    border: 'none',
    fontWeight: '700',
    fontSize: '0.88rem',
    cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(59,130,246,0.3)',
  },
};
