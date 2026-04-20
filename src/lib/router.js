import { useCallback, useEffect, useMemo, useState } from 'react';

function getLocationState() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
  };
}

export function useRouter() {
  const [location, setLocation] = useState(getLocationState);

  useEffect(() => {
    const onPopState = () => setLocation(getLocationState());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    if (to === `${window.location.pathname}${window.location.search}`) {
      return;
    }
    if (replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }
    setLocation(getLocationState());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

  return {
    ...location,
    query,
    navigate,
  };
}

export function matchRoute(pathname) {
  if (pathname === '/') return { name: 'home' };
  if (pathname === '/courses') return { name: 'courses' };
  if (pathname === '/quiz') return { name: 'quiz' };
  if (pathname === '/contact') return { name: 'contact' };
  if (pathname === '/login') return { name: 'login' };
  if (pathname === '/register') return { name: 'register' };
  if (pathname === '/admin') return { name: 'admin' };

  const courseMatch = pathname.match(/^\/course\/(\d+)$/);
  if (courseMatch) {
    return { name: 'course-detail', courseId: Number(courseMatch[1]) };
  }

  return { name: 'not-found' };
}
