import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { validateEmail, validateMessage, validateName } from '../lib/validation';

export default function ContactPage() {
  const { lang, showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const nameRef    = useRef(null);
  const emailRef   = useRef(null);
  const messageRef = useRef(null);

  const submit = (event) => {
    event.preventDefault();

    const nextErrors = {
      name:    validateName(name, lang),
      email:   validateEmail(email, lang),
      message: validateMessage(message, lang, 12),
    };
    setErrors(nextErrors);

    if (nextErrors.name) {
      nameRef.current?.focus();
      nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (nextErrors.email) {
      emailRef.current?.focus();
      emailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (nextErrors.message) {
      messageRef.current?.focus();
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setName('');
    setEmail('');
    setMessage('');
    setErrors({ name: '', email: '', message: '' });
    setSubmitted(true);
    showToast(
      lang === 'kz' ? 'Хабарламаңыз сәтті жіберілді!' : 'Message sent successfully!',
      'success'
    );
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <main>
      <div className="page-header">
        <h1>
          {lang === 'kz' ? (
            <>
              БІЗБЕН <span>БАЙЛАНЫСЫҢЫЗ</span>
            </>
          ) : (
            <>
              GET IN <span>TOUCH</span>
            </>
          )}
        </h1>
        <p>
          {lang === 'kz'
            ? 'Сұрақтарыңыз бар ма? Кез келген уақытта хабарласыңыз'
            : 'Have questions? Contact us anytime'}
        </p>
      </div>

      <section>
        <div className="contact-grid">
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">✉</div>
              <div>
                <h4>Email</h4>
                <p>info@jsha.kz</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <div>
                <h4>{lang === 'kz' ? 'Телефон' : 'Phone'}</h4>
                <p>+7 700 123 45 67</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <div>
                <h4>{lang === 'kz' ? 'Мекенжай' : 'Address'}</h4>
                <p>{lang === 'kz' ? 'Астана, Қазақстан' : 'Astana, Kazakhstan'}</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">🕐</div>
              <div>
                <h4>{lang === 'kz' ? 'Жұмыс уақыты' : 'Working Hours'}</h4>
                <p>
                  {lang === 'kz'
                    ? 'Дүйсенбі – Жұма: 09:00 – 18:00'
                    : 'Mon – Fri: 09:00 – 18:00'}
                </p>
              </div>
            </div>
          </div>

          <div className="contact-form">
            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                letterSpacing: '2px',
                marginBottom: '16px',
              }}
            >
              {lang === 'kz' ? (
                <>
                  ХАБАРЛАМА <span style={{ color: 'var(--accent)' }}>ЖІБЕРУ</span>
                </>
              ) : (
                <>
                  SEND <span style={{ color: 'var(--accent)' }}>MESSAGE</span>
                </>
              )}
            </h4>

            {submitted && (
              <div
                role="status"
                style={{
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid var(--success)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  color: 'var(--success)',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>✅</span>
                {lang === 'kz'
                  ? 'Хабарламаңыз сәтті жіберілді! Жақын арада жауап береміз.'
                  : 'Your message has been sent! We will get back to you shortly.'}
              </div>
            )}

            {(errors.name || errors.email || errors.message) && (
              <div
                role="alert"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid var(--danger)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: 'var(--danger)',
                }}
              >
                <strong>
                  {lang === 'kz'
                    ? '⚠️ Төмендегі қателерді түзетіңіз:'
                    : '⚠️ Please fix the following errors:'}
                </strong>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                  {errors.name    && <li>{errors.name}</li>}
                  {errors.email   && <li>{errors.email}</li>}
                  {errors.message && <li>{errors.message}</li>}
                </ul>
              </div>
            )}

            <form id="contactForm" onSubmit={submit} noValidate>
              {/* Name */}
              <div className="form-group">
                <label htmlFor="contactName">
                  {lang === 'kz' ? 'Аты-жөні' : 'Name'}
                  <span style={{ color: 'var(--danger)', marginLeft: '3px' }}>*</span>
                </label>
                <input
                  ref={nameRef}
                  id="contactName"
                  type="text"
                  placeholder={lang === 'kz' ? 'Аты-жөніңіз' : 'Your name'}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={errors.name ? 'input-error' : name ? 'input-success' : ''}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'nameError' : undefined}
                />
                {errors.name && (
                  <span
                    id="nameError"
                    className="field-error"
                    role="alert"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span aria-hidden="true">⚠</span> {errors.name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contactEmail">
                  Email
                  <span style={{ color: 'var(--danger)', marginLeft: '3px' }}>*</span>
                </label>
                <input
                  ref={emailRef}
                  id="contactEmail"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  className={errors.email ? 'input-error' : email ? 'input-success' : ''}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'emailError' : undefined}
                />
                {errors.email && (
                  <span
                    id="emailError"
                    className="field-error"
                    role="alert"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span aria-hidden="true">⚠</span> {errors.email}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contactMessage">
                  {lang === 'kz' ? 'Хабарлама' : 'Message'}
                  <span style={{ color: 'var(--danger)', marginLeft: '3px' }}>*</span>
                </label>
                <textarea
                  ref={messageRef}
                  id="contactMessage"
                  placeholder={
                    lang === 'kz'
                      ? 'Хабарламаңызды жазыңыз (кемінде 12 таңба)…'
                      : 'Write your message (at least 12 chars)…'
                  }
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setErrors((prev) => ({ ...prev, message: '' }));
                  }}
                  className={errors.message ? 'input-error' : message ? 'input-success' : ''}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'messageError' : 'messageHint'}
                />
                {errors.message ? (
                  <span
                    id="messageError"
                    className="field-error"
                    role="alert"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span aria-hidden="true">⚠</span> {errors.message}
                  </span>
                ) : (
                  <span
                    id="messageHint"
                    style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}
                  >
                    {lang === 'kz'
                      ? `${message.trim().length} / кемінде 12 таңба`
                      : `${message.trim().length} / min 12 chars`}
                  </span>
                )}
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                {lang === 'kz' ? '— міндетті өрістер' : '— required fields'}
              </p>

              <button type="submit" className="btn btn-primary form-btn">
                {lang === 'kz' ? 'Жіберу' : 'Send'} →
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}