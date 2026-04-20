import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import AppLink from './AppLink';

function Logo() {
  return (
    <div className="logo">
      <div className="logo-icon">JS</div>
      <span className="logo-text">
        HEROES <span>ACADEMY</span>
      </span>
    </div>
  );
}

function TelegramFloat() {
  const trackClick = () => {
    fetch('/api/telemetry/telegram-click', { method: 'POST' }).catch(() => {});
  };

  return (
    <a
      href="https://t.me/jsheroes_bot"
      target="_blank"
      rel="noreferrer"
      className="telegram-float"
      aria-label="Open JS Heroes Telegram bot"
      title="JS Heroes Telegram Bot"
      onClick={trackClick}
    >
      <span className="tg-icon">✈️</span>
      <span className="tg-label">Telegram Bot</span>
      <span className="tg-pulse" />
    </a>
  );
}

export default function SiteLayout({ children, pageKey, navigate }) {
  const { lang, theme, user, toggleLang, toggleTheme, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const authName = useMemo(() => {
    if (!user?.name) return null;
    return user.name.split(' ')[0];
  }, [user]);

  const navClass = menuOpen ? 'nav-links open' : 'nav-links';

  const handleLogout = (event) => {
    event.preventDefault();
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header>
        <div className="header-inner">
          <AppLink to="/" navigate={navigate} onClick={closeMenu}>
            <Logo />
          </AppLink>

          <div className="hamburger" onClick={() => setMenuOpen((prev) => !prev)}>
            <span />
            <span />
            <span />
          </div>

          <nav>
            <div className={navClass}>
              <AppLink to="/" navigate={navigate} className={pageKey === 'home' ? 'active' : ''} onClick={closeMenu}>
                HOME
              </AppLink>
              <AppLink
                to="/courses"
                navigate={navigate}
                className={pageKey === 'courses' || pageKey === 'course-detail' ? 'active' : ''}
                onClick={closeMenu}
              >
                COURSES
              </AppLink>
              <AppLink to="/quiz" navigate={navigate} className={pageKey === 'quiz' ? 'active' : ''} onClick={closeMenu}>
                QUIZ
              </AppLink>
              <AppLink to="/contact" navigate={navigate} className={pageKey === 'contact' ? 'active' : ''} onClick={closeMenu}>
                CONTACT
              </AppLink>

              {user ? (
                <AppLink
                  to="/courses"
                  navigate={navigate}
                  className="auth-link"
                  onClick={closeMenu}
                  style={{ color: 'var(--gold)', fontWeight: 600 }}
                >
                  {authName}
                </AppLink>
              ) : (
                <AppLink to="/login" navigate={navigate} className="btn-login auth-link" onClick={closeMenu}>
                  LOGIN
                </AppLink>
              )}

              <a
                href="#"
                className="logout-link"
                onClick={handleLogout}
                style={{ display: user ? '' : 'none', color: 'var(--text-muted)', fontSize: '12px' }}
              >
                {lang === 'kz' ? 'Шығу' : 'Logout'}
              </a>
            </div>

            <div className="header-controls">
              <button className="ctrl-btn lang-btn" onClick={toggleLang} type="button">
                <span className="lang-btn-text">{lang.toUpperCase()}</span>
              </button>
              <button className="ctrl-btn" onClick={toggleTheme} type="button">
                <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {children}

      <footer>
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-brand">
              <Logo />
              <p>
                {lang === 'kz'
                  ? 'Marvel стиліндегі интерактивті JavaScript оқыту платформасы.'
                  : 'Marvel-style interactive JavaScript learning platform in Kazakh and English.'}
              </p>
            </div>
            <div className="footer-col">
              <h4>{lang === 'kz' ? 'Навигация' : 'Navigation'}</h4>
              <ul>
                <li>
                  <AppLink to="/" navigate={navigate}>Home</AppLink>
                </li>
                <li>
                  <AppLink to="/courses" navigate={navigate}>{lang === 'kz' ? 'Курстар' : 'Courses'}</AppLink>
                </li>
                <li>
                  <AppLink to="/quiz" navigate={navigate}>{lang === 'kz' ? 'Тест' : 'Quiz'}</AppLink>
                </li>
                <li>
                  <AppLink to="/contact" navigate={navigate}>{lang === 'kz' ? 'Байланыс' : 'Contact'}</AppLink>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>{lang === 'kz' ? 'Аккаунт' : 'Account'}</h4>
              <ul>
                <li>
                  <AppLink to="/login" navigate={navigate}>{lang === 'kz' ? 'Кіру' : 'Login'}</AppLink>
                </li>
                <li>
                  <AppLink to="/register" navigate={navigate}>{lang === 'kz' ? 'Тіркелу' : 'Register'}</AppLink>
                </li>
                <li>
                  <AppLink to="/admin" navigate={navigate}>{lang === 'kz' ? 'Админ' : 'Admin'}</AppLink>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>{lang === 'kz' ? 'Байланыс' : 'Contact'}</h4>
              <ul>
                <li>
                  <a href="mailto:info@jsha.kz">info@jsha.kz</a>
                </li>
                <li>
                  <a href="tel:+77001234567">+7 700 123 45 67</a>
                </li>
                <li>
                  <a href="https://t.me/jsheroes_bot" target="_blank" rel="noreferrer">
                    {lang === 'kz' ? 'Telegram бот' : 'Telegram bot'}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">© 2026 JS Heroes Academy.</div>
        </div>
      </footer>

      <TelegramFloat />
    </>
  );
}
