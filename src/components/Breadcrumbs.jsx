import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const ROUTE_NAMES = {
  '/': { en: 'Home', kz: 'Басты бет' },
  '/courses': { en: 'Courses', kz: 'Курстар' },
  '/quiz': { en: 'Quiz', kz: 'Тест' },
  '/contact': { en: 'Contact', kz: 'Байланыс' },
  '/login': { en: 'Login', kz: 'Кіру' },
  '/register': { en: 'Register', kz: 'Тіркелу' },
  '/admin': { en: 'Admin', kz: 'Админ' },
};

export default function Breadcrumbs() {
  const location = useLocation();
  const { lang } = useApp();

  const pathnames = location.pathname.split('/').filter((x) => x);

   if (pathnames.length === 0) {
    return null;
  }

  const breadcrumbs = [];
  let currentPath = '';

  pathnames.forEach((name, index) => {
    currentPath += `/${name}`;
    
     const isNumericId = /^\d+$/.test(name);
    const isLast = index === pathnames.length - 1;
    
    let label;
    if (isNumericId) {
       label = lang === 'kz' ? `Курс #${name}` : `Course #${name}`;
    } else {
      label = ROUTE_NAMES[currentPath]?.[lang] || name.charAt(0).toUpperCase() + name.slice(1);
    }

    breadcrumbs.push({
      path: currentPath,
      label,
      isLast,
    });
  });

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol className="breadcrumbs-list">
        <li className="breadcrumbs-item">
          <Link to="/" className="breadcrumbs-link">
            {ROUTE_NAMES['/'][lang]}
          </Link>
          <span className="breadcrumbs-separator">›</span>
        </li>
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="breadcrumbs-item">
            {crumb.isLast ? (
              <span className="breadcrumbs-current" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <>
                <Link to={crumb.path} className="breadcrumbs-link">
                  {crumb.label}
                </Link>
                <span className="breadcrumbs-separator">›</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
