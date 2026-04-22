import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { getEnrolledIds, setEnrolledIds } from '../lib/storage';
import AppLink from '../components/AppLink';

const PAGE_SIZE = 6;

export default function CoursesPage() {
  const { lang, user, showToast, toggleLike, isLiked, saveProgress } = useApp();
  const navigate = useNavigate();
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterDiff, setFilterDiff] = useState('all');
  const [filterHero, setFilterHero] = useState('all');
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);
  const [modalCourse, setModalCourse] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .getCourses()
      .then((courses) => {
        if (mounted) {
          setAllCourses(courses);
        }
      })
      .catch(() => {
        if (mounted) {
          setAllCourses([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...allCourses];
    const q = query.trim().toLowerCase();

    if (q) {
      list = list.filter((course) => {
        const text = `${course.en.title} ${course.kz.title} ${course.en.desc} ${course.kz.desc}`.toLowerCase();
        return text.includes(q);
      });
    }

    if (filterDiff !== 'all') {
      list = list.filter((course) => course.category === filterDiff);
    }

    if (filterHero !== 'all') {
      list = list.filter((course) => course.heroType === filterHero);
    }

    if (sort !== 'default') {
      list.sort((a, b) => {
        const ta = lang === 'kz' ? a.kz.title : a.en.title;
        const tb = lang === 'kz' ? b.kz.title : b.en.title;
        return sort === 'asc' ? ta.localeCompare(tb) : tb.localeCompare(ta);
      });
    }

    return list;
  }, [allCourses, query, filterDiff, filterHero, sort, lang]);

  useEffect(() => {
    setPage(1);
  }, [query, filterDiff, filterHero, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedCourses = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const enrollCourse = async (courseId, title) => {
    if (!user) {
      showToast(lang === 'kz' ? 'Алдымен кіріңіз!' : 'Please login first!', 'warning');
      navigate('/login');
      return;
    }

    const enrolled = getEnrolledIds();
    if (enrolled.includes(courseId)) {
      showToast(lang === 'kz' ? 'Сіз бұл курсқа жазылғансыз' : 'Already enrolled', 'info');
      return;
    }

    const next = [...enrolled, courseId];
    setEnrolledIds(next);
    saveProgress({ enrolledCount: next.length, percent: Math.min(next.length * 5, 100) });

    try {
      await api.enroll({ userId: user.id, courseId });
    } catch {
      // local persistence already done
    }

    showToast(
      lang === 'kz' ? `"${title}" курсына жазылдыңыз!` : `Enrolled in "${title}"!`,
      'success',
    );
  };

  const openCourseModal = (course) => {
    setModalCourse(course);
    showToast(lang === 'kz' ? 'Курс ашылды' : 'Course opened', 'info');
  };

  const isEnrolled = (courseId) => getEnrolledIds().includes(courseId);

  return (
    <main>
      <div className="shield-header">
        <div className="shield-icon">🛡️</div>
        <h1>S.H.I.E.L.D. DATABASE</h1>
        <p className="subtitle">✦ STRATEGIC HOMELAND INTERVENTION, ENFORCEMENT AND LOGISTICS DIVISION</p>
      </div>

      <div className="search-filter-bar">
        <div className="search-row">
          <div className="search-input-wrap">
            <input
              type="text"
              className="search-input"
              placeholder="SEARCH PROTOCOLS..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <span className="filter-label">{lang === 'kz' ? 'ҚИЫНДЫҚ' : 'DIFFICULTY'}</span>
            <div className="filter-pills" id="difficultyPills">
              {['all', 'beginner', 'intermediate', 'advanced'].map((value) => (
                <button
                  key={value}
                  className={`pill ${filterDiff === value ? 'active' : ''}`}
                  data-val={value}
                  onClick={() => setFilterDiff(value)}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">{lang === 'kz' ? 'БАТЫР ТҮРІ' : 'HERO TYPE'}</span>
            <div className="filter-pills" id="heroPills">
              {['all', 'tech', 'magic', 'mutation'].map((value) => (
                <button
                  key={value}
                  className={`pill ${filterHero === value ? 'active' : ''}`}
                  data-val={value}
                  onClick={() => setFilterHero(value)}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="sort-bar">
        <label>SORT:</label>
        <button
          className={`sort-btn ${sort === 'default' ? 'active' : ''}`}
          data-sort="default"
          onClick={() => {
            setSort('default');
            showToast(lang === 'kz' ? 'Сұрыпталды' : 'Sorted!', 'info');
          }}
        >
          {lang === 'kz' ? 'Әдепкі' : 'Default'}
        </button>
        <button
          className={`sort-btn ${sort === 'asc' ? 'active' : ''}`}
          data-sort="asc"
          onClick={() => {
            setSort('asc');
            showToast(lang === 'kz' ? 'Сұрыпталды' : 'Sorted!', 'info');
          }}
        >
          A → Z
        </button>
        <button
          className={`sort-btn ${sort === 'desc' ? 'active' : ''}`}
          data-sort="desc"
          onClick={() => {
            setSort('desc');
            showToast(lang === 'kz' ? 'Сұрыпталды' : 'Sorted!', 'info');
          }}
        >
          Z → A
        </button>
      </div>

      <div className="files-count">
        <span>
          FILES FOUND: <strong id="filesCount">{filtered.length}</strong>
        </span>
        <span>📋 AUTH LEVEL: ALPHA</span>
      </div>

      <div className="courses-list" id="coursesList">
        {loading && <div className="empty-state">Loading...</div>}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <span>🔍</span>
            {lang === 'kz' ? 'Курс табылмады' : 'No courses found'}
          </div>
        )}

        {!loading &&
          pagedCourses.map((course) => {
            const title = lang === 'kz' ? course.kz.title : course.en.title;
            const desc = lang === 'kz' ? course.kz.desc : course.en.desc;

            return (
              <div className="course-card" key={course.id} style={{ cursor: 'default' }}>
                <div className="card-thumb" style={{ cursor: 'pointer' }} onClick={() => openCourseModal(course)}>
                  <img src={course.img} alt={title} loading="lazy" />
                  <div className="play-overlay">
                    <div className="play-icon">▶</div>
                    <span className="play-label">Preview</span>
                  </div>
                </div>
                <div className="card-content">
                  <div className="card-tags">
                    <span className={`tag tag-${course.heroType}`}>{course.heroType.toUpperCase()}</span>
                    <span className={`tag tag-${course.category}`}>✦ {course.category.toUpperCase()}</span>
                  </div>
                  <h3 style={{ cursor: 'pointer' }} onClick={() => openCourseModal(course)}>
                    {title}
                  </h3>
                  <p>{desc}</p>
                </div>
                <div className="card-action">
                  <button className="enroll-btn" onClick={() => enrollCourse(course.id, title)}>
                    ENROLL ✦
                  </button>
                  <button
                    data-like-id={course.id}
                    onClick={() => toggleLike(course.id)}
                    style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', padding: '4px' }}
                    title="Favorite"
                  >
                    {isLiked(course.id) ? '❤️' : '🤍'}
                  </button>
                  <span className="status-badge">
                    STATUS: <span>ACTIVE</span>
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {!loading && filtered.length > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
          >
            {lang === 'kz' ? '← Алдыңғы' : '← Prev'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {lang === 'kz' ? 'Бет' : 'Page'} {currentPage} / {totalPages}
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
          >
            {lang === 'kz' ? 'Келесі →' : 'Next →'}
          </button>
        </div>
      )}

      {modalCourse && (
        <div className="modal-overlay active" id="courseModal" onClick={() => setModalCourse(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 id="modalTitle" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '2px' }}>
                {lang === 'kz' ? modalCourse.kz.title : modalCourse.en.title}
              </h3>
              <button
                onClick={() => setModalCourse(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '22px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <img
              src={modalCourse.img}
              alt={lang === 'kz' ? modalCourse.kz.title : modalCourse.en.title}
              style={{ width: '100%', borderRadius: '8px', marginBottom: '16px', maxHeight: '200px', objectFit: 'cover' }}
            />
            <div className="card-tags" style={{ marginBottom: '12px' }}>
              <span className={`tag tag-${modalCourse.heroType}`}>{modalCourse.heroType.toUpperCase()}</span>
              <span className={`tag tag-${modalCourse.category}`}>{modalCourse.category.toUpperCase()}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
              {lang === 'kz' ? modalCourse.kz.desc : modalCourse.en.desc}
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() =>
                  enrollCourse(modalCourse.id, lang === 'kz' ? modalCourse.kz.title : modalCourse.en.title)
                }
              >
                {isEnrolled(modalCourse.id)
                  ? lang === 'kz'
                    ? '✅ Жазылғансыз'
                    : '✅ Enrolled'
                  : lang === 'kz'
                    ? 'Жазылу ✦'
                    : 'Enroll ✦'}
              </button>
              <button
                onClick={() => toggleLike(modalCourse.id)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-solid)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                {isLiked(modalCourse.id) ? '❤️ Saved' : '🤍 Save'}
              </button>
              <AppLink to={`/course/${modalCourse.id}`} className="btn btn-secondary btn-sm">
                {lang === 'kz' ? 'Толығырақ →' : 'View Course →'}
              </AppLink>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
