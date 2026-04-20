import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { getLastEmail, loginFromLS, setLastEmail } from '../lib/storage';
import SpinnerOverlay from '../components/SpinnerOverlay';
import AppLink from '../components/AppLink';

export default function LoginPage({ navigate }) {
  const { lang, login, showToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = getLastEmail();
    if (saved) setEmail(saved);
  }, []);

  const validateEmail = () => {
    const value = email.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value) {
      return lang === 'kz' ? 'Email енгізіңіз' : 'Enter your email';
    }
    if (!re.test(value)) {
      return lang === 'kz' ? 'Email форматы дұрыс емес' : 'Invalid email';
    }
    return '';
  };

  const validatePass = () => {
    if (!password) {
      return lang === 'kz' ? 'Пароль енгізіңіз' : 'Enter password';
    }
    if (password.length < 6) {
      return lang === 'kz' ? 'Кемінде 6 таңба' : 'Min 6 characters';
    }
    return '';
  };

  const submit = async () => {
    const nextErrors = {
      email: validateEmail(),
      password: validatePass(),
    };
    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) return;

    const cleanEmail = email.trim();

    setLoading(true);

    const localResult = loginFromLS(cleanEmail, password, lang);
    if (localResult.success) {
      login(localResult.user);
      setLastEmail(cleanEmail);
      showToast(lang === 'kz' ? 'Сәтті кірдіңіз!' : 'Welcome back!', 'success');
      navigate('/courses');
      setLoading(false);
      return;
    }

    try {
      const data = await api.login({ email: cleanEmail, password });
      login(data.user);
      setLastEmail(cleanEmail);
      showToast(lang === 'kz' ? 'Сәтті кірдіңіз!' : 'Welcome back!', 'success');
      navigate('/courses');
    } catch (error) {
      showToast(error.message || localResult.error, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="form-page">
        <div className="form-container">
          <h2>
            WELCOME <span>BACK</span>
          </h2>
          <p className="form-subtitle">{lang === 'kz' ? 'Аккаунтыңызға кіріңіз' : 'Log in to your account'}</p>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              id="loginEmail"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: '' }));
              }}
              className={errors.email ? 'input-error' : email ? 'input-success' : ''}
            />
            <span className="field-error">{errors.email}</span>
          </div>

          <div className="form-group">
            <label>{lang === 'kz' ? 'Пароль' : 'Password'}</label>
            <div className="pass-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                id="loginPassword"
                placeholder="••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: '' }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
                className={errors.password ? 'input-error' : password ? 'input-success' : ''}
              />
              <button type="button" className="pass-toggle" onClick={() => setShowPass((prev) => !prev)}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            <span className="field-error">{errors.password}</span>
          </div>

          <button className="btn btn-primary form-btn" onClick={submit}>
            {lang === 'kz' ? 'Кіру' : 'Login'} →
          </button>

          <p className="form-link">
            {lang === 'kz' ? 'Аккаунтыңыз жоқ па?' : "Don't have an account?"}{' '}
            <AppLink to="/register" navigate={navigate}>
              {lang === 'kz' ? 'Тіркелу' : 'Register'}
            </AppLink>
          </p>
        </div>
      </main>

      <SpinnerOverlay visible={loading} />
    </>
  );
}
