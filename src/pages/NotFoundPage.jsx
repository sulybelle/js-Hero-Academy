import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLink from '../components/AppLink';
import { useApp } from '../context/AppContext';

export default function NotFoundPage() {
  const { lang } = useApp();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown <= 0) {
      navigate('/', { replace: true });
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <main>
      <section>
        <div
          style={{
            maxWidth: '600px',
            margin: '60px auto',
            textAlign: 'center',
            padding: '0 20px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(80px, 20vw, 160px)',
              lineHeight: 1,
              color: 'var(--accent)',
              textShadow:
                '2px 2px 0px var(--accent-dark), -2px -2px 0px var(--accent-light)',
              marginBottom: '8px',
              letterSpacing: '4px',
            }}
          >
            404
          </div>

          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 5vw, 32px)',
              letterSpacing: '2px',
              marginBottom: '12px',
              color: 'var(--text-main)',
            }}
          >
            {lang === 'kz' ? (
              <>
                БЕТ <span style={{ color: 'var(--accent)' }}>ТАБЫЛМАДЫ</span>
              </>
            ) : (
              <>
                PAGE <span style={{ color: 'var(--accent)' }}>NOT FOUND</span>
              </>
            )}
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '15px',
              marginBottom: '8px',
              lineHeight: 1.6,
            }}
          >
            {lang === 'kz'
              ? 'Сіз іздеген бет жоқ немесе жойылған. URL мекенжайын тексеріп, қайта көріңіз.'
              : "The page you're looking for doesn't exist or has been removed. Please check the URL and try again."}
          </p>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '13px',
              marginBottom: '28px',
            }}
          >
            {lang === 'kz'
              ? `Басты бетке ${countdown} секундта автоматты түрде өтесіз…`
              : `Redirecting to home in ${countdown} second${countdown !== 1 ? 's' : ''}…`}
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <AppLink to="/" className="btn btn-primary">
              🏠 {lang === 'kz' ? 'Басты бетке' : 'Back to Home'}
            </AppLink>
            <AppLink to="/courses" className="btn btn-secondary">
              📚 {lang === 'kz' ? 'Курстарға өту' : 'Browse Courses'}
            </AppLink>
          </div>

          <div
            style={{
              margin: '36px auto 20px',
              height: '1px',
              background: 'var(--border-solid)',
              width: '80%',
            }}
          />

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '13px',
              marginBottom: '10px',
            }}
          >
            {lang === 'kz' ? 'Пайдалы сілтемелер:' : 'Helpful links:'}
          </p>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              fontSize: '13px',
            }}
          >
            <AppLink to="/" style={{ color: 'var(--accent)' }}>
              {lang === 'kz' ? 'Басты бет' : 'Home'}
            </AppLink>
            <AppLink to="/courses" style={{ color: 'var(--accent)' }}>
              {lang === 'kz' ? 'Курстар' : 'Courses'}
            </AppLink>
            <AppLink to="/contact" style={{ color: 'var(--accent)' }}>
              {lang === 'kz' ? 'Байланыс' : 'Contact'}
            </AppLink>
            <AppLink to="/login" style={{ color: 'var(--accent)' }}>
              {lang === 'kz' ? 'Кіру' : 'Login'}
            </AppLink>
          </div>
        </div>
      </section>
    </main>
  );
}
