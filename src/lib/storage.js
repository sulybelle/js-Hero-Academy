const KEYS = {
  lang: 'jsha_lang',
  theme: 'jsha_theme',
  user: 'jsha_user',
  users: 'jsha_users',
  comments: 'jsha_comments',
  likes: 'jsha_likes',
  progress: 'jsha_progress',
  enrolled: 'jsha_enrolled',
  lastEmail: 'jsha_last_email',
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredLang() {
  return localStorage.getItem(KEYS.lang) || 'en';
}

export function setStoredLang(lang) {
  localStorage.setItem(KEYS.lang, lang);
}

export function getStoredTheme() {
  return localStorage.getItem(KEYS.theme) || 'dark';
}

export function setStoredTheme(theme) {
  localStorage.setItem(KEYS.theme, theme);
}

export function getUser() {
  return readJSON(KEYS.user, null);
}

export function setUser(user) {
  if (!user) {
    localStorage.removeItem(KEYS.user);
    return;
  }
  writeJSON(KEYS.user, user);
}

export function getAllUsersLS() {
  return readJSON(KEYS.users, []);
}

export function saveUserToLS(userData, lang = 'en') {
  const users = getAllUsersLS();
  const exists = users.find((u) => u.email.toLowerCase() === userData.email.toLowerCase());
  if (exists) {
    return {
      success: false,
      error: lang === 'kz' ? 'Бұл email тіркелген' : 'Email already registered',
    };
  }

  const newUser = {
    id: Date.now(),
    name: userData.name,
    phone: userData.phone,
    email: userData.email,
    password: userData.password,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeJSON(KEYS.users, users);

  return {
    success: true,
    user: { id: newUser.id, name: newUser.name, email: newUser.email },
  };
}

export function loginFromLS(email, password, lang = 'en') {
  const users = getAllUsersLS();
  const found = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );

  if (!found) {
    return {
      success: false,
      error: lang === 'kz' ? 'Email немесе пароль қате' : 'Invalid email or password',
    };
  }

  return {
    success: true,
    user: { id: found.id, name: found.name, email: found.email },
  };
}

export function getCommentsFromLS(courseId) {
  const all = readJSON(KEYS.comments, []);
  if (courseId === undefined || courseId === null) {
    return all;
  }
  return all.filter((c) => c.courseId === courseId);
}

export function saveCommentToLS(commentData) {
  const all = readJSON(KEYS.comments, []);
  const newComment = {
    id: Date.now(),
    courseId: commentData.courseId ?? null,
    userName: commentData.userName,
    text: commentData.text,
    rating: commentData.rating || 5,
    createdAt: new Date().toISOString(),
  };
  all.push(newComment);
  writeJSON(KEYS.comments, all);
  return newComment;
}

export function getLikes() {
  return readJSON(KEYS.likes, []);
}

export function setLikes(likes) {
  writeJSON(KEYS.likes, likes);
}

export function getProgress() {
  return readJSON(KEYS.progress, {});
}

export function saveProgress(data) {
  const current = getProgress();
  const updated = { ...current, ...data, updatedAt: Date.now() };
  writeJSON(KEYS.progress, updated);
  return updated;
}

export function getEnrolledIds() {
  return readJSON(KEYS.enrolled, []);
}

export function setEnrolledIds(ids) {
  writeJSON(KEYS.enrolled, ids);
}

export function setLastEmail(email) {
  writeJSON(KEYS.lastEmail, email);
}

export function getLastEmail() {
  return readJSON(KEYS.lastEmail, null);
}
