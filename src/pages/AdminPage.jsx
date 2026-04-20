import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';

const EMPTY_COURSE = {
  titleEn: '',
  titleKz: '',
  descEn: '',
  descKz: '',
  category: 'beginner',
  heroType: 'tech',
  img: '',
  video: '',
};

export default function AdminPage() {
  const { lang, showToast } = useApp();

  const [tab, setTab] = useState('users');
  const [usersData, setUsersData] = useState([]);
  const [coursesData, setCoursesData] = useState([]);
  const [scoresData, setScoresData] = useState([]);
  const [overview, setOverview] = useState(null);

  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    try {
      const [users, courses, scores, adminOverview] = await Promise.all([
        api.getUsers(),
        api.getCourses(),
        api.getScores(),
        api.getAdminOverview(),
      ]);

      setUsersData(users);
      setCoursesData(courses);
      setScoresData(scores);
      setOverview(adminOverview);
    } catch (error) {
      showToast(error.message || 'Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const topScorers = useMemo(() => {
    if (!overview?.topScorers?.length) return [];
    return overview.topScorers;
  }, [overview]);

  const deleteUser = async (id) => {
    if (!window.confirm(lang === 'kz' ? 'Пайдаланушыны өшіреміз бе?' : 'Delete user?')) return;
    try {
      await api.deleteUser(id);
      showToast(lang === 'kz' ? 'Пайдаланушы өшірілді' : 'User deleted', 'success');
      await loadAll();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm(lang === 'kz' ? 'Курсты өшіреміз бе?' : 'Delete course?')) return;
    try {
      await api.deleteCourse(id);
      showToast(lang === 'kz' ? 'Курс өшірілді' : 'Course deleted', 'success');
      await loadAll();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const submitCourse = async (event) => {
    event.preventDefault();

    try {
      await api.addCourse({
        en: {
          title: courseForm.titleEn,
          desc: courseForm.descEn,
        },
        kz: {
          title: courseForm.titleKz,
          desc: courseForm.descKz,
        },
        category: courseForm.category,
        heroType: courseForm.heroType,
        img: courseForm.img,
        video: courseForm.video,
      });

      setModalOpen(false);
      setCourseForm(EMPTY_COURSE);
      showToast(lang === 'kz' ? 'Курс қосылды' : 'Course added', 'success');
      await loadAll();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <main>
      <section>
        <div className="admin-header">
          <h2>
            ADMIN <span>PANEL</span>
          </h2>
          <div className="admin-actions">
            <a href="/api/export/users" className="btn btn-gold btn-sm">
              📄 {lang === 'kz' ? 'Пайдаланушылар Excel' : 'Export Users'}
            </a>
            <a href="/api/export/full-report" className="btn btn-secondary btn-sm">
              📊 {lang === 'kz' ? 'Толық Excel отчет' : 'Full Excel Report'}
            </a>
            <a href="/api/export/analytics.json" className="btn btn-secondary btn-sm">
              🧾 {lang === 'kz' ? 'Analytics JSON' : 'Analytics JSON'}
            </a>
            <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
              + {lang === 'kz' ? 'Курс қосу' : 'Add Course'}
            </button>
          </div>
        </div>

        <div className="admin-stats" id="adminStats">
          <div className="admin-stat">
            <div className="label">Users</div>
            <div className="value">{overview?.stats?.users ?? usersData.length}</div>
          </div>
          <div className="admin-stat">
            <div className="label">Courses</div>
            <div className="value">{overview?.stats?.courses ?? coursesData.length}</div>
          </div>
          <div className="admin-stat">
            <div className="label">Scores</div>
            <div className="value">{overview?.stats?.scores ?? scoresData.length}</div>
          </div>
          <div className="admin-stat">
            <div className="label">Reviews</div>
            <div className="value">{overview?.stats?.reviews ?? 0}</div>
          </div>
          <div className="admin-stat">
            <div className="label">Avg Score</div>
            <div className="value">{overview?.stats?.avgScore ?? 0}%</div>
          </div>
        </div>

        <div className="admin-tabs">
          {[['users', 'Users'], ['courses', 'Courses'], ['scores', 'Scores'], ['analytics', 'Analytics']].map(([key, label]) => (
            <button key={key} className={`admin-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: 'var(--text-muted)', padding: '16px' }}>Loading...</p>}

        {!loading && tab === 'users' && (
          <div id="usersTab">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{lang === 'kz' ? 'Аты' : 'Name'}</th>
                  <th>{lang === 'kz' ? 'Телефон' : 'Phone'}</th>
                  <th>Email</th>
                  <th>{lang === 'kz' ? 'Күні' : 'Date'}</th>
                  <th>{lang === 'kz' ? 'Әрекет' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody id="usersBody">
                {usersData.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.phone}</td>
                    <td>{u.email}</td>
                    <td>{new Date(u.registeredAt || u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => setSelectedUser(u)}>
                        View
                      </button>{' '}
                      <button className="btn btn-sm btn-danger" onClick={() => deleteUser(u.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usersData.length === 0 && (
              <p id="noUsers" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                {lang === 'kz' ? 'Тіркелген пайдаланушылар жоқ' : 'No users registered yet'}
              </p>
            )}
          </div>
        )}

        {!loading && tab === 'courses' && (
          <div id="coursesTab">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Title (KZ)</th>
                  <th>{lang === 'kz' ? 'Деңгей' : 'Level'}</th>
                  <th>Type</th>
                  <th>{lang === 'kz' ? 'Әрекет' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody id="coursesBody">
                {coursesData.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.en.title}</td>
                    <td>{c.kz.title}</td>
                    <td>
                      <span className={`tag tag-${c.category}`}>{c.category}</span>
                    </td>
                    <td>
                      <span className={`tag tag-${c.heroType}`}>{c.heroType}</span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteCourse(c.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tab === 'scores' && (
          <div id="scoresTab">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Course</th>
                  <th>Score</th>
                  <th>%</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody id="scoresBody">
                {scoresData.map((s) => {
                  const course = coursesData.find((x) => x.id === s.courseId);
                  return (
                    <tr key={`${s.userId}-${s.courseId}`}>
                      <td>{s.userName}</td>
                      <td>{course ? course.en.title : s.courseId}</td>
                      <td>
                        {s.score}/{s.total}
                      </td>
                      <td>{s.percentage}%</td>
                      <td>{new Date(s.date).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tab === 'analytics' && (
          <div id="analyticsTab">
            <div className="admin-stats" style={{ marginTop: '12px' }}>
              <div className="admin-stat">
                <div className="label">Top Course</div>
                <div className="value" style={{ fontSize: '22px' }}>
                  {overview?.topCourses?.[0]?.title || '—'}
                </div>
              </div>
              <div className="admin-stat">
                <div className="label">Enrollments</div>
                <div className="value">{overview?.stats?.enrollments || 0}</div>
              </div>
              <div className="admin-stat">
                <div className="label">Telegram Clicks</div>
                <div className="value">{overview?.stats?.telegramClicks || 0}</div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>Top Scorers</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Average %</th>
                    <th>Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {topScorers.map((item) => (
                    <tr key={item.userName}>
                      <td>{item.userName}</td>
                      <td>{item.avgPercentage}%</td>
                      <td>{item.attempts}</td>
                    </tr>
                  ))}
                  {topScorers.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ color: 'var(--text-muted)' }}>
                        No analytics data yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="modal-overlay active" id="addModal" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              ADD <span>COURSE</span>
            </h3>
            <form id="addForm" onSubmit={submitCourse}>
              <div className="form-group">
                <label>Title (EN)</label>
                <input
                  type="text"
                  required
                  value={courseForm.titleEn}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, titleEn: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Title (KZ)</label>
                <input
                  type="text"
                  required
                  value={courseForm.titleKz}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, titleKz: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Description (EN)</label>
                <input
                  type="text"
                  value={courseForm.descEn}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, descEn: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Description (KZ)</label>
                <input
                  type="text"
                  value={courseForm.descKz}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, descKz: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={courseForm.category}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, category: e.target.value }))}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label>Hero Type</label>
                <select
                  value={courseForm.heroType}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, heroType: e.target.value }))}
                >
                  <option value="tech">Tech</option>
                  <option value="magic">Magic</option>
                  <option value="mutation">Mutation</option>
                </select>
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={courseForm.img}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, img: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>YouTube URL</label>
                <input
                  type="url"
                  value={courseForm.video}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, video: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {lang === 'kz' ? 'Қосу' : 'Add'}
                </button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>
                  {lang === 'kz' ? 'Бас тарту' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="modal-overlay active" id="userModal" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              USER <span>DATA</span>
            </h3>
            <div id="userData" style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Name:</strong> {selectedUser.name}
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Phone:</strong> {selectedUser.phone}
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Email:</strong> {selectedUser.email}
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Registered:</strong>{' '}
                {new Date(selectedUser.registeredAt || selectedUser.createdAt).toLocaleString()}
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Enrolled:</strong>{' '}
                {selectedUser.enrolledCourses?.length || 0} courses
              </div>
            </div>
            <button className="btn btn-secondary mt-24" style={{ width: '100%' }} onClick={() => setSelectedUser(null)}>
              {lang === 'kz' ? 'Жабу' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
