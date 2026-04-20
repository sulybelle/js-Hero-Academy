import { useState } from 'react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { saveProgress, saveUserToLS } from '../lib/storage';
import SpinnerOverlay from '../components/SpinnerOverlay';
import AppLink from '../components/AppLink';

export default function RegisterPage({ navigate }) {
  const { lang, login, showToast } = useApp();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirm: '',
  });

  const [errors, setErrors] = useState({});

  const validateName = () => {
    const v = form.name.trim();
    if (!v) return lang === 'kz' ? 'Атыңызды енгізіңіз' : 'Please enter your name';
    if (v.length < 2) return lang === 'kz' ? 'Кемінде 2 таңба' : 'Min 2 characters';
    return '';
  };

  const validatePhone = () => {
    const v = form.phone.trim();
    const re = /^\+?[\d\s\-()]{7,15}$/;
    if (!v) return lang === 'kz' ? 'Телефон нөмірін енгізіңіз' : 'Enter phone number';
    if (!re.test(v)) return lang === 'kz' ? 'Нөмір дұрыс емес' : 'Invalid phone number';
    return '';
  };

  const validateEmail = () => {
    const v = form.email.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!v) return lang === 'kz' ? 'Email енгізіңіз' : 'Enter your email';
    if (!re.test(v)) return lang === 'kz' ? 'Email форматы дұрыс емес' : 'Invalid email format';
    return '';
  };

  const validatePass = () => {
    if (!form.password) return lang === 'kz' ? 'Пароль енгізіңіз' : 'Enter password';
    if (form.password.length < 6) return lang === 'kz' ? 'Кемінде 6 таңба' : 'Min 6 characters';
    return '';
  };

  const validateConfirm = () => {
    if (!form.confirm) return lang === 'kz' ? 'Парольді растаңыз' : 'Confirm your password';
    if (form.confirm !== form.password) {
      return lang === 'kz' ? 'Парольдер сәйкес келмейді' : 'Passwords do not match';
    }
    return '';
  };

  const validateStep = (stepNo) => {
    if (stepNo === 1) {
      const nextErrors = { name: validateName(), phone: validatePhone() };
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return !nextErrors.name && !nextErrors.phone;
    }

    if (stepNo === 2) {
      const nextErrors = { email: validateEmail(), password: validatePass(), confirm: validateConfirm() };
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return !nextErrors.email && !nextErrors.password && !nextErrors.confirm;
    }

    return true;
  };

  const goStep = (nextStep) => {
    if (nextStep > step && !validateStep(step)) return;
    setStep(nextStep);
  };

  const submit = async () => {
    if (!validateStep(2)) {
      setStep(2);
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    setLoading(true);

    const lsResult = saveUserToLS(payload, lang);
    if (!lsResult.success) {
      showToast(lsResult.error, 'error');
      setLoading(false);
      return;
    }

    try {
      const data = await api.register(payload);
      login(data.user || lsResult.user);
      saveProgress({ registered: true, percent: 10 });
      showToast(lang === 'kz' ? 'Тіркелу сәтті!' : 'Registration successful!', 'success');
      navigate('/courses');
    } catch {
      login(lsResult.user);
      saveProgress({ registered: true, percent: 10 });
      showToast(lang === 'kz' ? 'Тіркелу сәтті! (офлайн)' : 'Registered (offline)!', 'success');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="form-page">
        <div className="form-container" style={{ maxWidth: '480px' }}>
          <h2>
            CREATE <span>ACCOUNT</span>
          </h2>
          <p className="form-subtitle">{lang === 'kz' ? 'Академияға тіркеліп, оқуды бастаңыз' : 'Join the academy and start learning'}</p>

          <div className="steps-indicator">
            {[1, 2, 3].map((dot) => (
              <div key={dot} style={{ display: 'contents' }}>
                <div className={`step-dot ${step === dot ? 'active' : ''} ${step > dot ? 'done' : ''}`}>
                  {dot}
                </div>
                {dot < 3 && <div className="step-line" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="form-step active" id="step1">
              <h4 style={{ fontSize: '13px', color: 'var(--accent)', letterSpacing: '1px', marginBottom: '16px' }}>
                {lang === 'kz' ? '1-ҚАДАМ — Жеке мәліметтер' : 'STEP 1 — Personal Info'}
              </h4>

              <div className="form-group">
                <label>{lang === 'kz' ? 'Аты-жөні' : 'Full Name'}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Айбек Серікұлы"
                  className={errors.name ? 'input-error' : form.name ? 'input-success' : ''}
                />
                <span className="field-error">{errors.name || ''}</span>
              </div>

              <div className="form-group">
                <label>{lang === 'kz' ? 'Телефон' : 'Phone'}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+7 700 000 00 00"
                  className={errors.phone ? 'input-error' : form.phone ? 'input-success' : ''}
                />
                <span className="field-error">{errors.phone || ''}</span>
              </div>

              <div className="step-nav">
                <button className="btn btn-primary" onClick={() => goStep(2)}>
                  {lang === 'kz' ? 'Келесі' : 'Next'} →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step active" id="step2">
              <h4 style={{ fontSize: '13px', color: 'var(--accent)', letterSpacing: '1px', marginBottom: '16px' }}>
                {lang === 'kz' ? '2-ҚАДАМ — Аккаунт' : 'STEP 2 — Account'}
              </h4>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                  className={errors.email ? 'input-error' : form.email ? 'input-success' : ''}
                />
                <span className="field-error">{errors.email || ''}</span>
              </div>

              <div className="form-group">
                <label>{lang === 'kz' ? 'Пароль' : 'Password'}</label>
                <div className="pass-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder={lang === 'kz' ? 'Кемінде 6 таңба' : 'Min 6 chars'}
                    className={errors.password ? 'input-error' : form.password ? 'input-success' : ''}
                  />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass((prev) => !prev)}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                <span className="field-error">{errors.password || ''}</span>
              </div>

              <div className="form-group">
                <label>{lang === 'kz' ? 'Парольді растаңыз' : 'Confirm Password'}</label>
                <div className="pass-wrap">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={(e) => setForm((prev) => ({ ...prev, confirm: e.target.value }))}
                    placeholder={lang === 'kz' ? 'Парольді қайталаңыз' : 'Repeat password'}
                    className={errors.confirm ? 'input-error' : form.confirm ? 'input-success' : ''}
                  />
                  <button type="button" className="pass-toggle" onClick={() => setShowConfirm((prev) => !prev)}>
                    {showConfirm ? '🙈' : '👁'}
                  </button>
                </div>
                <span className="field-error">{errors.confirm || ''}</span>
              </div>

              <div className="step-nav">
                <button className="btn btn-secondary" onClick={() => goStep(1)}>
                  ← {lang === 'kz' ? 'Артқа' : 'Back'}
                </button>
                <button className="btn btn-primary" onClick={() => goStep(3)}>
                  {lang === 'kz' ? 'Келесі' : 'Next'} →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step active" id="step3">
              <h4 style={{ fontSize: '13px', color: 'var(--accent)', letterSpacing: '1px', marginBottom: '16px' }}>
                {lang === 'kz' ? '3-ҚАДАМ — Растау' : 'STEP 3 — Confirm'}
              </h4>

              <div id="summaryBox" style={{ marginBottom: '20px' }}>
                <div className="summary-item">
                  <span>{lang === 'kz' ? 'Аты-жөні' : 'Full Name'}</span>
                  <span>{form.name}</span>
                </div>
                <div className="summary-item">
                  <span>{lang === 'kz' ? 'Телефон' : 'Phone'}</span>
                  <span>{form.phone}</span>
                </div>
                <div className="summary-item">
                  <span>Email</span>
                  <span>{form.email}</span>
                </div>
                <div className="summary-item">
                  <span>{lang === 'kz' ? 'Пароль' : 'Password'}</span>
                  <span>••••••</span>
                </div>
              </div>

              <div className="step-nav">
                <button className="btn btn-secondary" onClick={() => goStep(2)}>
                  ← {lang === 'kz' ? 'Артқа' : 'Back'}
                </button>
                <button className="btn btn-primary" onClick={submit}>
                  {lang === 'kz' ? 'Тіркелу ✦' : 'Register ✦'}
                </button>
              </div>
            </div>
          )}

          <p className="form-link">
            {lang === 'kz' ? 'Аккаунтыңыз бар ма?' : 'Already have an account?'}{' '}
            <AppLink to="/login" navigate={navigate}>
              {lang === 'kz' ? 'Кіру' : 'Login'}
            </AppLink>
          </p>
        </div>
      </main>

      <SpinnerOverlay visible={loading} />
    </>
  );
}
