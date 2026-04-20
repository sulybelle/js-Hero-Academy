import AppLink from '../components/AppLink';

export default function NotFoundPage() {
  return (
    <main>
      <section>
        <div className="course-detail-page text-center">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '60px' }}>404</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Page not found</p>
          <AppLink to="/" className="btn btn-primary">
            Back Home
          </AppLink>
        </div>
      </section>
    </main>
  );
}
