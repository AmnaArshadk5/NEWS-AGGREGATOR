import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function LandingPage({ onLoginClick }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

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

  return (
    <div style={styles.container}>
      {/* Editorial Top Bar */}
      <div style={styles.topBar}>
        <span>{currentDate}</span>
        <span>Vol. CXCIV, No. 59</span>
        <button
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            color: isDarkMode ? '#fbbf24' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-sans)',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Night Mode'}
        >
          {isDarkMode ? <Sun size={14} color="#fbbf24" /> : <Moon size={14} color="var(--text-secondary)" />}
          <span>{isDarkMode ? 'Day Mode' : 'Night Mode'}</span>
        </button>
      </div>

      {/* Masthead */}
      <header style={styles.header}>
        <div style={styles.masthead}>
          <h1 style={styles.brandTitle}>The Daily Wire</h1>
          <p style={styles.brandMotto}>"All the News That's Fit to Aggregate"</p>
        </div>
      </header>

      {/* Main Content Grid */}
      <main style={styles.mainGrid}>
        
        {/* Left Column: The Lead Story */}
        <article style={styles.leadArticle}>
          <h2 style={styles.headline}>
            A New Standard for Digital Journalism and Unbiased Reporting
          </h2>
          
          <div style={styles.authorLine}>
            By <strong>THE EDITORIAL BOARD</strong>
          </div>

          <div style={styles.articleBody}>
            <p style={styles.paragraph}>
              In an era dominated by algorithmic echo chambers and sensationalized headlines, the necessity for a structured, objective, and premium reading experience has never been more critical. 
            </p>
            <p style={styles.paragraph}>
              The Daily Wire strips away the noise, presenting you with a curated, high-density stream of global events. We prioritize typography, clarity, and factual density over generic icons and gamified user interfaces.
            </p>
            <p style={styles.paragraph}>
              By establishing an account, readers gain access to an immutable archive of saved dispatches, live-updating global markets, and strict data privacy protocols. No advertisements. No intrusive tracking.
            </p>

            <button onClick={onLoginClick} style={styles.subscribeBtn}>
              SUBSCRIBE / SIGN IN
            </button>
          </div>
        </article>

        {/* Right Column: The Columns / Standards */}
        <aside style={styles.sideColumn}>
          <div style={styles.sectionHeader}>
            <h3>EDITORIAL STANDARDS</h3>
          </div>
          
          <div style={styles.standardBlock}>
            <h4 style={styles.standardTitle}>I. Objective Curation</h4>
            <p style={styles.standardText}>News feeds are aggregated from verified, international sources without partisan filtering or algorithmic bias.</p>
          </div>

          <div style={styles.standardBlock}>
            <h4 style={styles.standardTitle}>II. Architectural Restraint</h4>
            <p style={styles.standardText}>The interface respects the reader's intelligence. Information is presented with rigorous typographical hierarchy.</p>
          </div>

          <div style={styles.standardBlock}>
            <h4 style={styles.standardTitle}>III. Reader Sovereignty</h4>
            <p style={styles.standardText}>Secure sessions, encrypted local history, and absolute control over your personal archive of saved articles.</p>
          </div>
          
          <div style={styles.divider}></div>
          
          <div style={styles.loginBlock}>
            <p style={styles.loginPrompt}>Already hold a subscription?</p>
            <button onClick={onLoginClick} style={styles.secondaryBtn}>
              Authenticate Session
            </button>
          </div>
        </aside>

      </main>

      <footer style={styles.footer}>
        <span>© 2026 The Daily Wire Company</span>
        <span>New York, NY</span>
        <span>Contact</span>
        <span>Terms of Service</span>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-page)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-serif)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 20px',
  },
  topBar: {
    width: '100%',
    maxWidth: '1100px',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid var(--border-medium)',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  header: {
    width: '100%',
    maxWidth: '1100px',
    textAlign: 'center',
    padding: '40px 0 20px 0',
    borderBottom: '4px double var(--border-medium)',
  },
  masthead: {
    display: 'inline-block',
  },
  brandTitle: {
    fontSize: '4.5rem',
    fontWeight: '700',
    fontFamily: 'var(--font-serif)',
    letterSpacing: '-1.5px',
    margin: '0 0 10px 0',
    color: 'var(--text-primary)',
  },
  brandMotto: {
    fontSize: '1rem',
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
    margin: 0,
    fontFamily: 'var(--font-serif)',
  },
  mainGrid: {
    width: '100%',
    maxWidth: '1100px',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '40px',
    padding: '40px 0',
    flex: 1,
  },
  leadArticle: {
    paddingRight: '20px',
    borderRight: '1px solid var(--border-light)',
  },
  headline: {
    fontSize: '2.4rem',
    lineHeight: '1.25',
    fontWeight: '700',
    margin: '0 0 20px 0',
    color: 'var(--text-primary)',
  },
  authorLine: {
    fontSize: '0.85rem',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '25px',
    paddingBottom: '10px',
    borderBottom: '1px solid var(--border-light)',
  },
  articleBody: {
    fontSize: '1.1rem',
    lineHeight: '1.7',
    color: 'var(--text-primary)',
  },
  paragraph: {
    marginBottom: '20px',
    textAlign: 'justify',
  },
  subscribeBtn: {
    display: 'block',
    width: '100%',
    padding: '16px',
    backgroundColor: 'var(--text-primary)',
    color: 'var(--bg-page)',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '700',
    fontFamily: 'var(--font-sans)',
    letterSpacing: '2px',
    cursor: 'pointer',
    marginTop: '30px',
    transition: 'opacity 0.2s',
  },
  sideColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionHeader: {
    borderBottom: '2px solid var(--text-primary)',
    paddingBottom: '5px',
    marginBottom: '10px',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-sans)',
    letterSpacing: '1px',
  },
  standardBlock: {
    marginBottom: '15px',
  },
  standardTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    marginBottom: '5px',
    color: 'var(--text-primary)',
  },
  standardText: {
    fontSize: '0.95rem',
    lineHeight: '1.5',
    color: 'var(--text-secondary)',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-medium)',
    margin: '10px 0',
  },
  loginBlock: {
    backgroundColor: 'var(--bg-card)',
    padding: '20px',
    border: '1px solid var(--border-medium)',
    textAlign: 'center',
  },
  loginPrompt: {
    fontSize: '0.95rem',
    marginBottom: '15px',
    fontStyle: 'italic',
  },
  secondaryBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--text-primary)',
    fontSize: '0.9rem',
    fontWeight: '600',
    fontFamily: 'var(--font-sans)',
    letterSpacing: '1px',
    cursor: 'pointer',
    textTransform: 'uppercase',
  },
  footer: {
    width: '100%',
    maxWidth: '1100px',
    padding: '20px 0',
    borderTop: '1px solid var(--border-medium)',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
  }
};
