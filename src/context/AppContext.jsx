import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  getLikes,
  getProgress,
  getStoredLang,
  getStoredTheme,
  getUser,
  saveProgress as persistProgress,
  setLikes,
  setStoredLang,
  setStoredTheme,
  setUser,
} from '../lib/storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLang] = useState(getStoredLang);
  const [theme, setTheme] = useState(getStoredTheme);
  const [user, setUserState] = useState(getUser);
  const [likes, setLikesState] = useState(getLikes);
  const [progress, setProgress] = useState(getProgress);
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    setStoredLang(lang);
  }, [lang]);

  useEffect(() => {
    setStoredTheme(theme);
    document.body.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  useEffect(() => {
    setUser(user);
  }, [user]);

  useEffect(() => {
    setLikes(likes);
  }, [likes]);

  const showToast = (message, type = 'info') => {
    const id = ++idRef.current;
    const toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3000);
  };

  const toggleLang = () => setLang((prev) => (prev === 'en' ? 'kz' : 'en'));
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const logout = () => {
    setUserState(null);
    showToast(lang === 'kz' ? 'Сіз шықтыңыз' : 'Logged out', 'info');
  };

  const login = (authUser) => {
    setUserState(authUser);
  };

  const toggleLike = (courseId) => {
    let likedNow = false;
    setLikesState((prev) => {
      const next = [...prev];
      const idx = next.indexOf(courseId);
      if (idx === -1) {
        next.push(courseId);
        likedNow = true;
      } else {
        next.splice(idx, 1);
        likedNow = false;
      }
      return next;
    });

    showToast(
      likedNow
        ? lang === 'kz'
          ? 'Таңдаулыларға қосылды ❤️'
          : 'Added to favorites ❤️'
        : lang === 'kz'
          ? 'Таңдаулылардан алынды'
          : 'Removed from favorites',
      likedNow ? 'success' : 'info',
    );

    return likedNow;
  };

  const isLiked = (courseId) => likes.includes(courseId);

  const saveProgress = (data) => {
    const updated = persistProgress(data);
    setProgress(updated);
    return updated;
  };

  const value = useMemo(
    () => ({
      lang,
      theme,
      user,
      likes,
      progress,
      toasts,
      toggleLang,
      toggleTheme,
      login,
      logout,
      setUser: setUserState,
      showToast,
      toggleLike,
      isLiked,
      saveProgress,
    }),
    [lang, theme, user, likes, progress, toasts],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside <AppProvider>');
  }
  return ctx;
}
