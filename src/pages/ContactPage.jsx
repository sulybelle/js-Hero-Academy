import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function ContactPage() {
  const { lang, showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const submit = (event) => {
    event.preventDefault();
    setName('');
    setEmail('');
    setMessage('');
    showToast(lang === 'kz' ? 'Хабарламаңыз сәтті жіберілді!' : 'Message sent successfully!', 'success');
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
        <p>{lang === 'kz' ? 'Сұрақтарыңыз бар ма? Кез келген уақытта хабарласыңыз' : 'Have questions? Contact us anytime'}</p>
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
                <p>{lang === 'kz' ? 'Дүйсенбі – Жұма: 09:00 – 18:00' : 'Mon – Fri: 09:00 – 18:00'}</p>
              </div>
            </div>
          </div>

          <div className="contact-form">
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '2px', marginBottom: '16px' }}>
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
            <form id="contactForm" onSubmit={submit}>
              <div className="form-group">
                <label>{lang === 'kz' ? 'Аты-жөні' : 'Name'}</label>
                <input type="text" placeholder="Your name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="email@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{lang === 'kz' ? 'Хабарлама' : 'Message'}</label>
                <textarea
                  placeholder="Your message..."
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
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
