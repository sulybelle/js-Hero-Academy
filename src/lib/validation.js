const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-()]{10,20}$/;

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function validateName(value, lang = 'en', minLength = 2) {
  const normalized = value.trim();
  if (!normalized) return lang === 'kz' ? 'Атыңызды енгізіңіз' : 'Please enter your name';
  if (normalized.length < minLength) return lang === 'kz' ? `Кемінде ${minLength} таңба` : `Min ${minLength} characters`;
  return '';
}

export function validatePhone(value, lang = 'en') {
  const normalized = value.trim();
  if (!normalized) return lang === 'kz' ? 'Телефон нөмірін енгізіңіз' : 'Enter phone number';
  if (!PHONE_RE.test(normalized)) return lang === 'kz' ? 'Нөмір дұрыс емес' : 'Invalid phone number';
  return '';
}

export function validateEmail(value, lang = 'en') {
  const normalized = value.trim();
  if (!normalized) return lang === 'kz' ? 'Email енгізіңіз' : 'Enter your email';
  if (!EMAIL_RE.test(normalized)) return lang === 'kz' ? 'Email форматы дұрыс емес' : 'Invalid email format';
  return '';
}

export function validatePassword(value, lang = 'en', minLength = 6) {
  if (!value) return lang === 'kz' ? 'Пароль енгізіңіз' : 'Enter password';
  if (value.length < minLength) return lang === 'kz' ? `Кемінде ${minLength} таңба` : `Min ${minLength} characters`;
  return '';
}

export function validatePasswordConfirm(password, confirm, lang = 'en') {
  if (!confirm) return lang === 'kz' ? 'Парольді растаңыз' : 'Confirm your password';
  if (confirm !== password) return lang === 'kz' ? 'Парольдер сәйкес келмейді' : 'Passwords do not match';
  return '';
}

export function validateMessage(value, lang = 'en', minLength = 10) {
  const normalized = value.trim();
  if (!normalized) return lang === 'kz' ? 'Хабарлама енгізіңіз' : 'Enter a message';
  if (normalized.length < minLength) return lang === 'kz' ? `Кемінде ${minLength} таңба жазыңыз` : `Write at least ${minLength} characters`;
  return '';
}

export function validateUrl(value, lang = 'en', labelEn = 'URL', labelKz = 'URL', required = false) {
  const normalized = value.trim();
  if (!normalized) {
    return required ? (lang === 'kz' ? `${labelKz} енгізіңіз` : `Enter ${labelEn}`) : '';
  }
  if (!isValidUrl(normalized)) {
    return lang === 'kz' ? `${labelKz} дұрыс емес` : `Invalid ${labelEn}`;
  }
  return '';
}
