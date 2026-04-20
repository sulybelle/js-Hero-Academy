import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { getCommentsFromLS, saveCommentToLS } from '../lib/storage';
import { useApp } from '../context/AppContext';
import AppLink from '../components/AppLink';
import { validateMessage, validateName } from '../lib/validation';

const FAQ_DATA = [
  {
    qEn: 'Do I need prior programming experience?',
    qKz: 'Алдын ала бағдарламалау тәжірибесі керек пе?',
    aEn: 'No prior experience needed. Courses start from basics and progress step by step.',
    aKz: 'Алдын ала тәжірибе қажет емес. Курстар негізден басталып, біртіндеп күрделенеді.',
  },
  {
    qEn: 'Are the courses available in Kazakh?',
    qKz: 'Курстар қазақ тілінде бар ма?',
    aEn: 'Yes, all courses are available in both Kazakh and English.',
    aKz: 'Иә, барлық курс қазақ және ағылшын тілдерінде қолжетімді.',
  },
  {
    qEn: 'How do quizzes work?',
    qKz: 'Тесттер қалай жұмыс істейді?',
    aEn: 'Each lesson has a quiz. Scores are saved and visible in your progress.',
    aKz: 'Әр сабаққа тест бар. Нәтижелер сақталып, прогрессте көрінеді.',
  },
  {
    qEn: 'Can I save favorite courses?',
    qKz: 'Таңдаулы курстарды сақтауға бола ма?',
    aEn: 'Yes, use the heart icon to save favorites.',
    aKz: 'Иә, жүрек белгісі арқылы таңдаулыға қоса аласыз.',
  },
  {
    qEn: 'Do I need registration?',
    qKz: 'Тіркелу міндетті ме?',
    aEn: 'Browsing is open, but enrollment and score tracking require an account.',
    aKz: 'Курстарды көру ашық, бірақ жазылу және балл сақтау үшін аккаунт керек.',
  },
];

export default function HomePage() {
  const { lang, showToast, toggleLike, isLiked } = useApp();
  const [tab, setTab] = useState('courses');
  const [openFaq, setOpenFaq] = useState(null);
  const [courses, setCourses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewName, setReviewName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewErrors, setReviewErrors] = useState({ name: '', text: '' });

  const topCourses = useMemo(() => courses.slice(0, 6), [courses]);

  async function loadReviews() {
    try {
      const serverReviews = await api.getReviews();
      const lsReviews = getCommentsFromLS(undefined).filter((c) => c.courseId === null);
      const serverIds = new Set(serverReviews.map((r) => String(r.id)));
      const lsOnly = lsReviews.filter((r) => !serverIds.has(String(r.id)));
      const combined = [...serverReviews, ...lsOnly]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6);
      setReviews(combined);
    } catch {
      setReviews(getCommentsFromLS(undefined).filter((c) => c.courseId === null).slice(0, 6));
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const fetchedCourses = await api.getCourses();
        if (mounted) {
          setCourses(fetchedCourses);
        }
      } catch {
        if (mounted) {
          setCourses([]);
        }
      }

      if (mounted) {
        await loadReviews();
        setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const openTab = (nextTab) => {
    setTab(nextTab);
    const names = {
      courses: { en: 'Courses', kz: 'Курстар' },
      reviews: { en: 'Reviews', kz: 'Пікірлер' },
      faq: { en: 'FAQ', kz: 'Сұрақтар' },
    };
    showToast(`${lang === 'kz' ? names[nextTab].kz : names[nextTab].en} ${lang === 'kz' ? 'бөлімі ашылды' : 'tab opened'}`, 'info');
  };

  const submitReview = async () => {
    const nextErrors = {
      name: validateName(reviewName, lang),
      text: validateMessage(reviewText, lang, 12),
    };
    setReviewErrors(nextErrors);

    if (nextErrors.name || nextErrors.text) {
      showToast(lang === 'kz' ? 'Форманы дұрыс толтырыңыз' : 'Please fix the form errors', 'warning');
      return;
    }

    const payload = {
      courseId: null,
      userName: reviewName.trim(),
      text: reviewText.trim(),
      rating,
    };

    saveCommentToLS(payload);

    try {
      await api.addReview(payload);
    } catch {
    }

    setReviewName('');
    setReviewText('');
    setRating(5);
    setReviewErrors({ name: '', text: '' });
    showToast(lang === 'kz' ? 'Пікір жіберілді! ⭐' : 'Review submitted! ⭐', 'success');
    await loadReviews();
  };

  return (
    <main>
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <div className="hero-badge">✦ {lang === 'kz' ? 'АКАДЕМИЯҒА ҚОШ КЕЛДІҢІЗ' : 'WELCOME TO THE ACADEMY'}</div>
            <h1>
              BECOME A JS
              <br />
              LEGEND!
            </h1>
            <p className="hero-desc">
              {lang === 'kz'
                ? 'Веб тілін қазақ және ағылшын тілдерінде меңгеріңіз. Бүгін кодтау дағдыларыңызды жинаңыз.'
                : 'Master the language of the web in Kazakh and English. Assemble your coding skills today.'}
            </p>
            <AppLink to="/courses" className="btn btn-primary">
              {lang === 'kz' ? 'ОҚУДЫ БАСТАУ' : 'START TRAINING'} ▶
            </AppLink>
          </div>

          <div className="hero-visual">
            <img
              src="https://avatars.mds.yandex.net/i?id=d7c66c5096d1a2ed46590fddb8cc95a5_l-12532291-images-thumbs&n=13"
              alt="Hero"
              className="hero-img"
            />
            <div className="code-float top">const hero = new JS();</div>
            <div className="code-float bottom">await hero.saveWorld();</div>
            <div className="chat-bubble">
              <div className="chat-avatar">🤖</div>
              <div className="chat-text">
                {lang === 'kz'
                  ? 'Жарайсыз! Сіздің кодыңыз Вибраниум сияқты мықты!'
                  : 'Great job! Your code is as strong as Vibranium!'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="tab-nav" role="tablist">
          <button className={`tab-nav-btn ${tab === 'courses' ? 'active' : ''}`} onClick={() => openTab('courses')}>
            🎓 {lang === 'kz' ? 'Курстар' : 'Courses'}
          </button>
          <button className={`tab-nav-btn ${tab === 'reviews' ? 'active' : ''}`} onClick={() => openTab('reviews')}>
            ⭐ {lang === 'kz' ? 'Пікірлер' : 'Reviews'}
          </button>
          <button className={`tab-nav-btn ${tab === 'faq' ? 'active' : ''}`} onClick={() => openTab('faq')}>
            ❓ {lang === 'kz' ? 'Сұрақтар' : 'FAQ'}
          </button>
        </div>

        {tab === 'courses' && (
          <div className="tab-pane active" id="tab-courses">
            <div className="section-header">
              <h2>
                {lang === 'kz' ? (
                  <>
                    ТАНЫМАЛ <span>КУРСТАР</span>
                  </>
                ) : (
                  <>
                    POPULAR <span>COURSES</span>
                  </>
                )}
              </h2>
              <p>{lang === 'kz' ? 'JavaScript батыр жолыңызды бастаңыз' : 'Start your JavaScript hero journey'}</p>
            </div>

            <div className="cards-grid" id="coursesGrid">
              {loading && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1 / -1', padding: '20px' }}>
                  Loading...
                </p>
              )}

              {!loading &&
                topCourses.map((course) => {
                  const title = lang === 'kz' ? course.kz.title : course.en.title;
                  const desc = lang === 'kz' ? course.kz.desc : course.en.desc;

                  return (
                    <AppLink key={course.id} to={`/course/${course.id}`} className="v-card">
                      <img className="v-card-img" src={course.img} alt={title} loading="lazy" />
                      <div className="v-card-body">
                        <div className="card-tags" style={{ marginBottom: '8px' }}>
                          <span className={`tag tag-${course.heroType}`}>{course.heroType.toUpperCase()}</span>
                          <span className={`tag tag-${course.category}`}>✦ {course.category.toUpperCase()}</span>
                        </div>
                        <h3>{title}</h3>
                        <p>{desc}</p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                          <span className="btn btn-primary btn-sm">{lang === 'kz' ? 'Курсты көру' : 'View Course'} →</span>
                          <button
                            type="button"
                            data-like-id={course.id}
                            onClick={(event) => {
                              event.preventDefault();
                              toggleLike(course.id);
                            }}
                            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                            title="Favorite"
                          >
                            {isLiked(course.id) ? '❤️' : '🤍'}
                          </button>
                        </div>
                      </div>
                    </AppLink>
                  );
                })}
            </div>

            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-num">20</div>
                <div className="stat-label">{lang === 'kz' ? 'Курстар' : 'Courses'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">20+</div>
                <div className="stat-label">{lang === 'kz' ? 'Тесттер' : 'Quizzes'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">2</div>
                <div className="stat-label">{lang === 'kz' ? 'Тілдер' : 'Languages'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">∞</div>
                <div className="stat-label">{lang === 'kz' ? 'Қол жетімділік' : 'Access'}</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="tab-pane active" id="tab-reviews">
            <div className="section-header">
              <h2>
                {lang === 'kz' ? (
                  <>
                    БАТЫРЛАР <span>ПІКІРЛЕРІ</span>
                  </>
                ) : (
                  <>
                    HERO <span>REVIEWS</span>
                  </>
                )}
              </h2>
            </div>

            <div className="reviews-grid" id="reviewsGrid">
              {reviews.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1 / -1', padding: '20px' }}>
                  {lang === 'kz' ? 'Пікірлер жоқ. Бірінші батыр болыңыз!' : 'No reviews yet. Be the first hero!'}
                </p>
              )}

              {reviews.map((review) => (
                <div className="review-card" key={review.id}>
                  <div className="review-header">
                    <div className="review-avatar">{review.userName.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="review-name">{review.userName}</div>
                      <div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                    </div>
                  </div>
                  <div className="review-text">{review.text}</div>
                  <div className="review-date">{new Date(review.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>

            <div className="review-form" style={{ maxWidth: '600px', margin: '24px auto 0' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '15px' }}>{lang === 'kz' ? 'Пікір қалдыру' : 'Leave a Review'}</h4>
              <input
                type="text"
                className="search-input"
                style={{ marginBottom: '10px', width: '100%', fontFamily: 'var(--font-body)' }}
                placeholder="Your name / Сіздің атыңыз"
                value={reviewName}
                onChange={(e) => {
                  setReviewName(e.target.value);
                  setReviewErrors((prev) => ({ ...prev, name: '' }));
                }}
                aria-invalid={Boolean(reviewErrors.name)}
              />
              <span className="field-error">{reviewErrors.name}</span>

              <div className="star-select" id="starSelect">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} onClick={() => setRating(n)} className={n <= rating ? 'active' : ''}>
                    ★
                  </span>
                ))}
              </div>

              <textarea
                value={reviewText}
                onChange={(e) => {
                  setReviewText(e.target.value);
                  setReviewErrors((prev) => ({ ...prev, text: '' }));
                }}
                className={reviewErrors.text ? 'input-error' : reviewText ? 'input-success' : ''}
                placeholder="Write your review... / Пікіріңізді жазыңыз..."
                aria-invalid={Boolean(reviewErrors.text)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-solid)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  resize: 'vertical',
                  minHeight: '80px',
                  marginBottom: '8px',
                }}
              />
              <span className="field-error">{reviewErrors.text}</span>

              <button className="btn btn-primary btn-sm" onClick={submitReview} type="button">
                {lang === 'kz' ? 'Жіберу' : 'Submit'}
              </button>
            </div>
          </div>
        )}

        {tab === 'faq' && (
          <div className="tab-pane active" id="tab-faq">
            <div className="section-header">
              <h2>
                {lang === 'kz' ? (
                  <>
                    ЖИІ ҚОЙЫЛАТЫН <span>СҰРАҚТАР</span>
                  </>
                ) : (
                  <>
                    FREQUENTLY ASKED <span>QUESTIONS</span>
                  </>
                )}
              </h2>
            </div>

            <div id="accordionContainer" style={{ maxWidth: '700px', margin: '0 auto' }}>
              {FAQ_DATA.map((item, index) => {
                const opened = openFaq === index;
                return (
                  <div key={item.qEn} className={`accordion-item ${opened ? 'open' : ''}`}>
                    <button className="accordion-header" onClick={() => setOpenFaq((prev) => (prev === index ? null : index))}>
                      <span>{lang === 'kz' ? item.qKz : item.qEn}</span>
                      <span className="accordion-icon">▼</span>
                    </button>
                    <div className={`accordion-body ${opened ? 'open' : ''}`}>{lang === 'kz' ? item.aKz : item.aEn}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
