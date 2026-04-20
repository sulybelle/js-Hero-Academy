import { useState } from 'react';
import Button from './Button';

const initialData = {
  name: '',
  email: '',
  phone: '',
};

export default function Form({ lang }) {
  const [formData, setFormData] = useState(initialData);
  const [message, setMessage] = useState('');

  function validate(data) {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
    const phoneOk = /^\+?[0-9]{10,15}$/.test(data.phone);
    if (!data.name.trim()) return lang === 'en' ? 'Name is required' : 'Аты міндетті';
    if (!emailOk) return lang === 'en' ? 'Invalid email format' : 'Email форматы қате';
    if (!phoneOk) return lang === 'en' ? 'Phone must be 10-15 digits' : 'Телефон 10-15 сан болуы керек';
    return '';
  }

  function handleSubmit(event) {
    event.preventDefault();
    const error = validate(formData);
    if (error) {
      setMessage(error);
      return;
    }
    setMessage(lang === 'en' ? 'Registration successful!' : 'Тіркелу сәтті аяқталды!');
    setFormData(initialData);
  }

  return (
    <section className="form-section">
      <h2>{lang === 'en' ? 'Join the Academy' : 'Академияға қосылу'}</h2>
      <form onSubmit={handleSubmit} className="enroll-form">
        <input
          type="text"
          placeholder={lang === 'en' ? 'Your name' : 'Атыңыз'}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          type="tel"
          placeholder={lang === 'en' ? 'Phone (+77001234567)' : 'Телефон (+77001234567)'}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <Button type="submit">{lang === 'en' ? 'Submit' : 'Жіберу'}</Button>
      </form>
      {message && <p className="form-message">{message}</p>}
    </section>
  );
}
