import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { getCommentsFromLS, saveCommentToLS } from '../lib/storage';
import { useApp } from '../context/AppContext';
import { normalizeYouTubeEmbed } from '../lib/youtube';
import AppLink from '../components/AppLink';

function toWatchUrl(embedUrl) {
  const normalized = normalizeYouTubeEmbed(embedUrl);
  const match = normalized.match(/\/embed\/([^?]+)/);
  if (!match) return normalized;
  return `https://www.youtube.com/watch?v=${match[1]}`;
}

export default function CourseDetailPage({ courseId, navigate }) {
  const { lang, user, toggleLike, isLiked, showToast, saveProgress } = useApp();
  const [courses, setCourses] = useState([]);
  const [comments, setComments] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);

  const course = useMemo(() => courses.find((item) => item.id === courseId), [courses, courseId]);
  const prevCourse = useMemo(() => courses.find((item) => item.id === courseId - 1), [courses, courseId]);
  const nextCourse = useMemo(() => courses.find((item) => item.id === courseId + 1), [courses, courseId]);

  async function loadComments() {
    const lsComments = getCommentsFromLS(courseId);

    try {
      const serverComments = await api.getReviews(courseId);
      const serverIds = new Set(serverComments.map((c) => String(c.id)));
      const lsOnly = lsComments.filter((c) => !serverIds.has(String(c.id)));
      const combined = [...serverComments, ...lsOnly].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );
      setComments(combined);
    } catch {
      setComments(lsComments);
    }
  }

  useEffect(() => {
    let mounted = true;
    api
      .getCourses()
      .then((data) => {
        if (mounted) setCourses(data);
      })
      .catch(() => {
        if (mounted) setCourses([]);
      });

    loadComments();

    return () => {
      mounted = false;
    };
  }, [courseId]);

  const enrollCourse = async () => {
    if (!user) {
      navigate('/register');
      return;
    }

    try {
      await api.enroll({ userId: user.id, courseId });
      showToast(lang === 'kz' ? 'Курсқа сәтті жазылдыңыз!' : 'Successfully enrolled!', 'success');
      saveProgress({ enrolledCourse: courseId, percent: 20 });
    } catch {
      showToast(lang === 'kz' ? 'Жергілікті түрде сақталды' : 'Saved locally', 'info');
      saveProgress({ enrolledCourse: courseId, percent: 20 });
    }
  };

  const submitComment = async () => {
    if (!name.trim() || !text.trim()) {
      showToast(lang === 'kz' ? 'Барлық өрістерді толтырыңыз' : 'Fill in all fields', 'warning');
      return;
    }

    const payload = {
      courseId,
      userName: name.trim(),
      text: text.trim(),
      rating,
    };

    saveCommentToLS(payload);

    try {
      await api.addReview(payload);
    } catch {
      // offline fallback сақталды
    }

    setName('');
    setText('');
    setRating(5);
    showToast(lang === 'kz' ? 'Пікір жіберілді! ⭐' : 'Comment saved! ⭐', 'success');
    await loadComments();
  };

  if (!course) {
    return (
      <main>
        <section>
          <div className="course-detail-page">
            <p style={{ color: 'var(--text-muted)' }}>Course not found.</p>
          </div>
        </section>
      </main>
    );
  }

  const title = lang === 'kz' ? course.kz.title : course.en.title;
  const desc = lang === 'kz' ? course.kz.desc : course.en.desc;
  const embedUrl = normalizeYouTubeEmbed(course.video);

  return (
    <main>
      <section>
        <div className="course-detail-page" id="courseDetail">
          <AppLink
            to="/courses"
            navigate={navigate}
            style={{ color: 'var(--accent)', fontSize: '13px', display: 'inline-block', marginBottom: '20px' }}
          >
            ← {lang === 'kz' ? 'Курстарға оралу' : 'Back to Courses'}
          </AppLink>

          <div className="card-tags" style={{ marginBottom: '12px' }}>
            <span className={`tag tag-${course.heroType}`}>{course.heroType.toUpperCase()}</span>
            <span className={`tag tag-${course.category}`}>✦ {course.category.toUpperCase()}</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '38px', letterSpacing: '2px', marginBottom: '6px' }}>
            {title}
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px' }}>{desc}</p>

          <div className="video-wrapper">
            <iframe
              src={embedUrl}
              title={`${course.en.title} video`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '32px' }}>
            {user ? (
              <button className="btn btn-primary" onClick={enrollCourse}>
                {lang === 'kz' ? 'Курсқа жазылу' : 'Enroll in Course'} ✦
              </button>
            ) : (
              <AppLink to="/register" navigate={navigate} className="btn btn-primary">
                {lang === 'kz' ? 'Тіркеліп жазылу' : 'Register to Enroll'} ✦
              </AppLink>
            )}

            <AppLink to={`/quiz?course=${course.id}`} navigate={navigate} className="btn btn-secondary">
              {lang === 'kz' ? 'Тестке кіру' : 'Take Quiz'} →
            </AppLink>

            <button
              data-like-id={course.id}
              onClick={() => toggleLike(course.id)}
              style={{
                background: 'none',
                border: '1px solid var(--border-solid)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '20px',
                cursor: 'pointer',
                color: 'var(--text)',
              }}
            >
              {isLiked(course.id) ? '❤️' : '🤍'}
            </button>

            <a href={toWatchUrl(course.video)} className="btn btn-secondary" target="_blank" rel="noreferrer">
              {lang === 'kz' ? 'YouTube-та ашу' : 'Open on YouTube'} ↗
            </a>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            {prevCourse ? (
              <AppLink to={`/course/${prevCourse.id}`} navigate={navigate} className="btn btn-secondary btn-sm">
                ← {lang === 'kz' ? 'Алдыңғы' : 'Previous'}
              </AppLink>
            ) : (
              <div />
            )}

            {nextCourse ? (
              <AppLink to={`/course/${nextCourse.id}`} navigate={navigate} className="btn btn-secondary btn-sm">
                {lang === 'kz' ? 'Келесі' : 'Next'} →
              </AppLink>
            ) : (
              <div />
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="course-detail-page">
          <div className="section-header" style={{ textAlign: 'left' }}>
            <h2>
              {lang === 'kz' ? (
                <>
                  САБАҚ <span>ПІКІРЛЕРІ</span>
                </>
              ) : (
                <>
                  LESSON <span>COMMENTS</span>
                </>
              )}
            </h2>
          </div>

          <div id="commentsGrid" className="reviews-grid">
            {comments.length === 0 && (
              <p style={{ color: 'var(--text-muted)', padding: '16px' }}>
                {lang === 'kz' ? 'Пікірлер жоқ.' : 'No comments yet.'}
              </p>
            )}

            {comments.map((comment) => (
              <div className="review-card" key={comment.id}>
                <div className="review-header">
                  <div className="review-avatar">{comment.userName.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="review-name">{comment.userName}</div>
                    <div className="review-stars">{'★'.repeat(comment.rating)}{'☆'.repeat(5 - comment.rating)}</div>
                  </div>
                </div>
                <div className="review-text">{comment.text}</div>
                <div className="review-date">{new Date(comment.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>

          <div className="review-form mt-24" id="commentForm">
            <h4 style={{ marginBottom: '12px', fontSize: '15px' }}>{lang === 'kz' ? 'Пікір қалдыру' : 'Leave a Comment'}</h4>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="search-input"
              style={{ marginBottom: '10px', width: '100%', fontFamily: 'var(--font-body)' }}
              placeholder="Your name / Сіздің атыңыз"
            />

            <div className="star-select" id="commentStarSelect">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} onClick={() => setRating(n)} className={n <= rating ? 'active' : ''}>
                  ★
                </span>
              ))}
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment... / Пікір жазыңыз..."
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
              }}
            />

            <button className="btn btn-primary btn-sm mt-16" onClick={submitComment}>
              {lang === 'kz' ? 'Жіберу' : 'Submit'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
