const express = require('express');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const { DatabaseSync } = require('node:sqlite');

const app = express();

const DATA_DIR = path.join(process.cwd(), 'api', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const DB_FILE = path.join(DATA_DIR, 'lab6.sqlite');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-()]{10,20}$/;
const HERO_TYPES = new Set(['tech', 'magic', 'mutation']);
const COURSE_LEVELS = new Set(['beginner', 'intermediate', 'advanced']);

const BONUS_QUESTIONS = [
  {
    en: 'Which habit improves JavaScript learning the fastest?',
    kz: 'JavaScript-ti tez menggeruge qai adet en paidaly?',
    options: ['Ignoring errors', 'Daily coding practice', 'Watching only theory', 'Skipping exercises'],
    correct: 1,
  },
  {
    en: 'Where can you track your quiz progress in this platform?',
    kz: 'Os y platformada test progressin qaidan kore alasyz?',
    options: ['Only in browser history', 'Only in Telegram', 'In saved score history', 'It is not saved'],
    correct: 2,
  },
];

const DEFAULT_SEED = {
  users: [],
  courses: [
    {
      id: 1,
      en: { title: 'Introduction to JavaScript', desc: 'Start from the fundamentals and build real logic.' },
      kz: { title: 'JavaScript-ke kirispe', desc: 'Negizden bastap naqty logika qurudy uireningiz.' },
      category: 'beginner',
      heroType: 'tech',
      video: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
      img: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
    },
  ],
  quizzes: [
    {
      courseId: 1,
      questions: [
        {
          en: 'What is JavaScript mostly used for?',
          kz: 'JavaScript kobinese ne ushin qoldanylady?',
          options: ['Operating systems', 'Web interactivity', 'Image editing', 'Database engine'],
          correct: 1,
        },
      ],
    },
  ],
  reviews: [],
  scores: [],
  telemetry: { telegramClicks: 0 },
};

app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC_DIR));
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

function normalizeYouTubeEmbed(url) {
  if (!url) return '';
  const raw = String(url).trim();

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace('www.', '');
    let videoId = '';

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0] || '';
      } else if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v') || '';
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/shorts/')[1]?.split('/')[0] || '';
      }
    } else if (host === 'youtu.be') {
      videoId = parsed.pathname.replace('/', '').split('/')[0];
    }

    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
    }
  } catch {
    return raw;
  }

  return raw;
}

function safeReadStoreSeed() {
  if (!fs.existsSync(STORE_FILE)) return DEFAULT_SEED;

  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
    return {
      users: Array.isArray(parsed.users) ? parsed.users : DEFAULT_SEED.users,
      courses: Array.isArray(parsed.courses) && parsed.courses.length ? parsed.courses : DEFAULT_SEED.courses,
      quizzes: Array.isArray(parsed.quizzes) && parsed.quizzes.length ? parsed.quizzes : DEFAULT_SEED.quizzes,
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : DEFAULT_SEED.reviews,
      scores: Array.isArray(parsed.scores) ? parsed.scores : DEFAULT_SEED.scores,
      telemetry: parsed.telemetry && typeof parsed.telemetry === 'object' ? parsed.telemetry : DEFAULT_SEED.telemetry,
    };
  } catch (error) {
    console.error('Failed to read store seed:', error.message);
    return DEFAULT_SEED;
  }
}

function sanitizeCourseSeed(raw, idx = 0) {
  const id = Number(raw?.id) || idx + 1;
  const fallbackImg = 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop';
  const category = COURSE_LEVELS.has(String(raw?.category || '').toLowerCase())
    ? String(raw.category).toLowerCase()
    : 'beginner';
  const heroType = HERO_TYPES.has(String(raw?.heroType || '').toLowerCase())
    ? String(raw.heroType).toLowerCase()
    : 'tech';

  return {
    id,
    en: {
      title: String(raw?.en?.title || `Course ${id}`).trim(),
      desc: String(raw?.en?.desc || 'JavaScript learning module.').trim(),
    },
    kz: {
      title: String(raw?.kz?.title || `Kurs ${id}`).trim(),
      desc: String(raw?.kz?.desc || 'JavaScript oqu moduli.').trim(),
    },
    category,
    heroType,
    video: normalizeYouTubeEmbed(raw?.video),
    img: String(raw?.img || fallbackImg).trim(),
  };
}

function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toCategoryName(slug) {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function parseIntSafe(value, fallback = null) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function cleanText(value) {
  return String(value || '').trim();
}

function isValidEmail(value) {
  return EMAIL_RE.test(value);
}

function isValidPhone(value) {
  return PHONE_RE.test(value);
}

function sanitizeUserResponse(row, enrolledIds = []) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    role: row.role,
    enrolledCourses: enrolledIds,
    registeredAt: row.created_at,
  };
}

function parseEnrolledIds(groupConcat) {
  if (!groupConcat) return [];
  return groupConcat
    .split(',')
    .map((item) => parseIntSafe(item, NaN))
    .filter((id) => Number.isInteger(id));
}

const seed = safeReadStoreSeed();

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_FILE);
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_en TEXT NOT NULL,
    title_kz TEXT NOT NULL,
    desc_en TEXT NOT NULL,
    desc_kz TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    hero_type TEXT NOT NULL,
    img TEXT NOT NULL,
    video TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrolled_at TEXT NOT NULL,
    UNIQUE(user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    user_name TEXT NOT NULL,
    text TEXT NOT NULL,
    rating INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    course_id INTEGER PRIMARY KEY,
    questions_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    course_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    date TEXT NOT NULL,
    UNIQUE(user_id, course_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS telemetry (
    key TEXT PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
  );
`);

const stmtInsertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)');
const stmtSelectCategoryBySlug = db.prepare('SELECT id, slug FROM categories WHERE slug = ?');
const stmtInsertCourse = db.prepare(`
  INSERT OR REPLACE INTO courses
    (id, title_en, title_kz, desc_en, desc_kz, category_id, hero_type, img, video, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const stmtInsertQuiz = db.prepare('INSERT OR REPLACE INTO quizzes (course_id, questions_json, updated_at) VALUES (?, ?, ?)');
const stmtInsertUser = db.prepare(`
  INSERT OR REPLACE INTO users (id, name, phone, email, password_hash, role, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const stmtInsertReview = db.prepare(`
  INSERT INTO reviews (course_id, user_name, text, rating, created_at)
  VALUES (?, ?, ?, ?, ?)
`);
const stmtInsertScore = db.prepare(`
  INSERT INTO scores (user_id, user_name, course_id, score, total, percentage, date)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

function ensureCategory(slug) {
  const safeSlug = toSlug(slug) || 'beginner';
  stmtInsertCategory.run(toCategoryName(safeSlug), safeSlug);
  const found = stmtSelectCategoryBySlug.get(safeSlug);
  return found?.id;
}

function ensureQuizQuestions(questions) {
  const normalized = Array.isArray(questions) ? [...questions] : [];
  BONUS_QUESTIONS.forEach((bonus) => {
    const exists = normalized.some((q) => q?.en === bonus.en);
    if (!exists) normalized.push({ ...bonus });
  });
  return normalized;
}

function runInTransaction(work) {
  db.exec('BEGIN');
  try {
    work();
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function seedDatabase() {
  const now = new Date().toISOString();

  const usersCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  const coursesCount = db.prepare('SELECT COUNT(*) AS count FROM courses').get().count;
  const quizzesCount = db.prepare('SELECT COUNT(*) AS count FROM quizzes').get().count;
  const reviewsCount = db.prepare('SELECT COUNT(*) AS count FROM reviews').get().count;
  const scoresCount = db.prepare('SELECT COUNT(*) AS count FROM scores').get().count;

  if (coursesCount === 0) {
    const sanitized = seed.courses.map((course, idx) => sanitizeCourseSeed(course, idx));
    runInTransaction(() => {
      sanitized.forEach((course) => {
        const categoryId = ensureCategory(course.category);
        const createdAt = now;

        stmtInsertCourse.run(
          course.id,
          course.en.title,
          course.kz.title,
          course.en.desc,
          course.kz.desc,
          categoryId,
          course.heroType,
          course.img,
          normalizeYouTubeEmbed(course.video),
          createdAt,
          createdAt,
        );
      });
    });
  }

  if (quizzesCount === 0) {
    runInTransaction(() => {
      seed.quizzes.forEach((quiz) => {
        const courseId = parseIntSafe(quiz.courseId, null);
        if (!courseId) return;

        const courseExists = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
        if (!courseExists) return;

        const questions = ensureQuizQuestions(quiz.questions);
        stmtInsertQuiz.run(courseId, JSON.stringify(questions), now);
      });
    });

    const missingCourseIds = db
      .prepare('SELECT c.id FROM courses c LEFT JOIN quizzes q ON q.course_id = c.id WHERE q.course_id IS NULL')
      .all();

    missingCourseIds.forEach((row) => {
      stmtInsertQuiz.run(row.id, JSON.stringify(ensureQuizQuestions([])), now);
    });
  }

  if (usersCount === 0 && Array.isArray(seed.users) && seed.users.length) {
    runInTransaction(() => {
      seed.users.forEach((user) => {
        const name = cleanText(user.name);
        const phone = cleanText(user.phone || '+7 700 000 00 00');
        const email = cleanText(user.email).toLowerCase();
        if (!name || !isValidEmail(email)) return;

        const rawPassword = cleanText(user.password);
        const passwordHash = rawPassword.startsWith('$2') ? rawPassword : bcrypt.hashSync(rawPassword || 'Password123!', 10);
        const role = user.role === 'admin' ? 'admin' : 'user';
        const createdAt = user.registeredAt || user.createdAt || now;

        stmtInsertUser.run(parseIntSafe(user.id, null), name, phone, email, passwordHash, role, createdAt);

        const enrolled = Array.isArray(user.enrolledCourses) ? user.enrolledCourses : [];
        enrolled.forEach((courseIdRaw) => {
          const courseId = parseIntSafe(courseIdRaw, null);
          if (!courseId) return;
          db.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)').run(
            parseIntSafe(user.id, 0),
            courseId,
            now,
          );
        });
      });
    });
  }

  const adminEmail = 'admin@jsha.kz';
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!adminExists) {
    db.prepare('INSERT INTO users (name, phone, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      'Admin User',
      '+7 700 111 22 33',
      adminEmail,
      bcrypt.hashSync('Admin123!', 10),
      'admin',
      now,
    );
  }

  if (reviewsCount === 0 && Array.isArray(seed.reviews) && seed.reviews.length) {
    runInTransaction(() => {
      seed.reviews.forEach((review) => {
        const courseId = review.courseId ? parseIntSafe(review.courseId, null) : null;
        const userName = cleanText(review.userName);
        const text = cleanText(review.text);
        const rating = Math.max(1, Math.min(5, parseIntSafe(review.rating, 5) || 5));
        const createdAt = review.createdAt || now;

        if (!userName || !text) return;
        stmtInsertReview.run(courseId, userName, text, rating, createdAt);
      });
    });
  }

  if (scoresCount === 0 && Array.isArray(seed.scores) && seed.scores.length) {
    runInTransaction(() => {
      seed.scores.forEach((scoreRow) => {
        const userId = parseIntSafe(scoreRow.userId, 0) || 0;
        const courseId = parseIntSafe(scoreRow.courseId, null);
        const score = parseIntSafe(scoreRow.score, null);
        const total = parseIntSafe(scoreRow.total, null);
        if (!courseId || score === null || !total || total <= 0) return;

        const percentage = Math.round((score / total) * 100);
        stmtInsertScore.run(
          userId,
          cleanText(scoreRow.userName) || 'Guest',
          courseId,
          score,
          total,
          percentage,
          scoreRow.date || now,
        );
      });
    });
  }

  db.prepare('INSERT OR IGNORE INTO telemetry (key, value) VALUES (?, ?)').run('telegramClicks', 0);
  if (seed.telemetry && Number.isFinite(Number(seed.telemetry.telegramClicks))) {
    db.prepare('UPDATE telemetry SET value = ? WHERE key = ?').run(Number(seed.telemetry.telegramClicks), 'telegramClicks');
  }
}

seedDatabase();

function mapCourseRow(row) {
  return {
    id: row.id,
    en: {
      title: row.title_en,
      desc: row.desc_en,
    },
    kz: {
      title: row.title_kz,
      desc: row.desc_kz,
    },
    category: row.category,
    heroType: row.hero_type,
    img: row.img,
    video: row.video,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function extractCoursePayload(body) {
  return {
    titleEn: cleanText(body?.en?.title || body?.titleEn),
    titleKz: cleanText(body?.kz?.title || body?.titleKz),
    descEn: cleanText(body?.en?.desc || body?.descEn),
    descKz: cleanText(body?.kz?.desc || body?.descKz),
    category: toSlug(body?.category || 'beginner') || 'beginner',
    heroType: cleanText(body?.heroType || 'tech').toLowerCase(),
    img: cleanText(body?.img),
    video: normalizeYouTubeEmbed(cleanText(body?.video)),
  };
}

function validateCoursePayload(payload) {
  if (!payload.titleEn || payload.titleEn.length < 2) return 'Title (EN) must be at least 2 characters';
  if (!payload.titleKz || payload.titleKz.length < 2) return 'Title (KZ) must be at least 2 characters';
  if (!payload.descEn || payload.descEn.length < 10) return 'Description (EN) must be at least 10 characters';
  if (!payload.descKz || payload.descKz.length < 10) return 'Description (KZ) must be at least 10 characters';
  if (!COURSE_LEVELS.has(payload.category)) return 'Category must be beginner/intermediate/advanced';
  if (!HERO_TYPES.has(payload.heroType)) return 'Hero type must be tech/magic/mutation';
  if (!payload.img) return 'Image URL is required';
  if (!payload.video) return 'YouTube URL is required';
  return '';
}

function getCourseList({ search = '', page = null, limit = null } = {}) {
  const where = [];
  const params = [];

  const q = cleanText(search).toLowerCase();
  if (q) {
    where.push('(LOWER(c.title_en) LIKE ? OR LOWER(c.title_kz) LIKE ? OR LOWER(c.desc_en) LIKE ? OR LOWER(c.desc_kz) LIKE ? OR LOWER(cat.slug) LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }

  let sql = `
    SELECT
      c.id,
      c.title_en,
      c.title_kz,
      c.desc_en,
      c.desc_kz,
      c.hero_type,
      c.img,
      c.video,
      c.created_at,
      c.updated_at,
      cat.slug AS category
    FROM courses c
    JOIN categories cat ON cat.id = c.category_id
  `;

  if (where.length) {
    sql += ` WHERE ${where.join(' AND ')}`;
  }

  sql += ' ORDER BY c.id ASC';

  if (Number.isInteger(page) && Number.isInteger(limit) && limit > 0) {
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
  }

  return db.prepare(sql).all(...params).map(mapCourseRow);
}

function countCourses(search = '') {
  const q = cleanText(search).toLowerCase();
  if (!q) {
    return db.prepare('SELECT COUNT(*) AS count FROM courses').get().count;
  }

  const like = `%${q}%`;
  return db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM courses c
      JOIN categories cat ON cat.id = c.category_id
      WHERE LOWER(c.title_en) LIKE ? OR LOWER(c.title_kz) LIKE ? OR LOWER(c.desc_en) LIKE ? OR LOWER(c.desc_kz) LIKE ? OR LOWER(cat.slug) LIKE ?
    `)
    .get(like, like, like, like, like).count;
}

function buildAdminOverview() {
  const statsRow = {
    users: db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    courses: db.prepare('SELECT COUNT(*) AS count FROM courses').get().count,
    scores: db.prepare('SELECT COUNT(*) AS count FROM scores').get().count,
    reviews: db.prepare('SELECT COUNT(*) AS count FROM reviews').get().count,
    enrollments: db.prepare('SELECT COUNT(*) AS count FROM enrollments').get().count,
    avgScore: db.prepare('SELECT COALESCE(ROUND(AVG(percentage)), 0) AS avgScore FROM scores').get().avgScore,
    telegramClicks: db.prepare('SELECT COALESCE(value, 0) AS value FROM telemetry WHERE key = ?').get('telegramClicks')?.value || 0,
  };

  const topCourses = db
    .prepare(`
      SELECT c.id AS courseId, c.title_en AS title, COUNT(e.id) AS enrolled
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      GROUP BY c.id
      ORDER BY enrolled DESC, c.id ASC
      LIMIT 5
    `)
    .all()
    .map((row) => ({
      courseId: row.courseId,
      title: row.title,
      enrolled: Number(row.enrolled) || 0,
    }));

  const topScorers = db
    .prepare(`
      SELECT user_name AS userName, COUNT(*) AS attempts, ROUND(AVG(percentage)) AS avgPercentage
      FROM scores
      GROUP BY user_name
      ORDER BY avgPercentage DESC, attempts DESC, user_name ASC
      LIMIT 10
    `)
    .all()
    .map((row) => ({
      userName: row.userName,
      attempts: Number(row.attempts) || 0,
      avgPercentage: Number(row.avgPercentage) || 0,
    }));

  return {
    stats: statsRow,
    topCourses,
    topScorers,
    generatedAt: new Date().toISOString(),
  };
}

app.get('/api/users', (req, res) => {
  const rows = db
    .prepare(`
      SELECT
        u.id,
        u.name,
        u.phone,
        u.email,
        u.role,
        u.created_at,
        COALESCE(GROUP_CONCAT(e.course_id), '') AS enrolled_ids
      FROM users u
      LEFT JOIN enrollments e ON e.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC, u.id DESC
    `)
    .all();

  const users = rows.map((row) => sanitizeUserResponse(row, parseEnrolledIds(row.enrolled_ids)));
  res.json(users);
});

app.post('/api/register', (req, res) => {
  const name = cleanText(req.body?.name);
  const phone = cleanText(req.body?.phone);
  const email = cleanText(req.body?.email).toLowerCase();
  const password = String(req.body?.password || '');

  if (!name || name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
  if (!isValidPhone(phone)) return res.status(400).json({ error: 'Invalid phone number' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email format' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(400).json({ error: 'Email already registered' });

  const createdAt = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 10);

  const result = db
    .prepare('INSERT INTO users (name, phone, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name, phone, email, passwordHash, 'user', createdAt);

  res.json({
    success: true,
    user: {
      id: Number(result.lastInsertRowid),
      name,
      email,
      role: 'user',
    },
  });
});

app.post('/api/login', (req, res) => {
  const email = cleanText(req.body?.email).toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const row = db.prepare('SELECT id, name, email, role, password_hash FROM users WHERE email = ?').get(email);
  if (!row) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({
    success: true,
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
    },
  });
});

app.put('/api/users/:id', (req, res) => {
  const id = parseIntSafe(req.params.id, null);
  if (!id) return res.status(400).json({ error: 'Invalid user id' });

  const current = db.prepare('SELECT id, name, phone, role FROM users WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'User not found' });

  const name = cleanText(req.body?.name || current.name);
  const phone = cleanText(req.body?.phone || current.phone);
  const role = req.body?.role === 'admin' ? 'admin' : 'user';

  if (!name || name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
  if (!isValidPhone(phone)) return res.status(400).json({ error: 'Invalid phone number' });

  db.prepare('UPDATE users SET name = ?, phone = ?, role = ? WHERE id = ?').run(name, phone, role, id);

  res.json({ success: true });
});

app.delete('/api/users/:id', (req, res) => {
  const id = parseIntSafe(req.params.id, null);
  if (!id) return res.status(400).json({ error: 'Invalid user id' });

  db.prepare('DELETE FROM scores WHERE user_id = ?').run(id);
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

  if (!result.changes) return res.status(404).json({ error: 'User not found' });

  res.json({ success: true });
});

app.get('/api/courses', (req, res) => {
  const search = cleanText(req.query.search || '');
  const page = parseIntSafe(req.query.page, null);
  const limit = parseIntSafe(req.query.limit, null);

  if (page && limit) {
    const safeLimit = Math.max(1, Math.min(limit, 50));
    const safePage = Math.max(1, page);
    const items = getCourseList({ search, page: safePage, limit: safeLimit });
    const total = countCourses(search);

    return res.json({
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    });
  }

  const items = getCourseList({ search });
  return res.json(items);
});

app.post('/api/courses', (req, res) => {
  const payload = extractCoursePayload(req.body);
  const error = validateCoursePayload(payload);
  if (error) return res.status(400).json({ error });

  const categoryId = ensureCategory(payload.category);
  const now = new Date().toISOString();

  const result = db
    .prepare(`
      INSERT INTO courses
        (title_en, title_kz, desc_en, desc_kz, category_id, hero_type, img, video, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      payload.titleEn,
      payload.titleKz,
      payload.descEn,
      payload.descKz,
      categoryId,
      payload.heroType,
      payload.img,
      payload.video,
      now,
      now,
    );

  const courseId = Number(result.lastInsertRowid);
  const questions = ensureQuizQuestions([]);
  stmtInsertQuiz.run(courseId, JSON.stringify(questions), now);

  const row = db
    .prepare(`
      SELECT c.id, c.title_en, c.title_kz, c.desc_en, c.desc_kz, c.hero_type, c.img, c.video, c.created_at, c.updated_at, cat.slug AS category
      FROM courses c
      JOIN categories cat ON cat.id = c.category_id
      WHERE c.id = ?
    `)
    .get(courseId);

  res.json({ success: true, course: mapCourseRow(row) });
});

app.put('/api/courses/:id', (req, res) => {
  const courseId = parseIntSafe(req.params.id, null);
  if (!courseId) return res.status(400).json({ error: 'Invalid course id' });

  const existing = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
  if (!existing) return res.status(404).json({ error: 'Course not found' });

  const payload = extractCoursePayload(req.body);
  const error = validateCoursePayload(payload);
  if (error) return res.status(400).json({ error });

  const categoryId = ensureCategory(payload.category);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE courses
    SET title_en = ?, title_kz = ?, desc_en = ?, desc_kz = ?, category_id = ?, hero_type = ?, img = ?, video = ?, updated_at = ?
    WHERE id = ?
  `).run(
    payload.titleEn,
    payload.titleKz,
    payload.descEn,
    payload.descKz,
    categoryId,
    payload.heroType,
    payload.img,
    payload.video,
    now,
    courseId,
  );

  const row = db
    .prepare(`
      SELECT c.id, c.title_en, c.title_kz, c.desc_en, c.desc_kz, c.hero_type, c.img, c.video, c.created_at, c.updated_at, cat.slug AS category
      FROM courses c
      JOIN categories cat ON cat.id = c.category_id
      WHERE c.id = ?
    `)
    .get(courseId);

  res.json({ success: true, course: mapCourseRow(row) });
});

app.delete('/api/courses/:id', (req, res) => {
  const courseId = parseIntSafe(req.params.id, null);
  if (!courseId) return res.status(400).json({ error: 'Invalid course id' });

  const result = db.prepare('DELETE FROM courses WHERE id = ?').run(courseId);
  if (!result.changes) return res.status(404).json({ error: 'Course not found' });

  res.json({ success: true });
});

app.post('/api/enroll', (req, res) => {
  const userId = parseIntSafe(req.body?.userId, null);
  const courseId = parseIntSafe(req.body?.courseId, null);

  if (!userId || !courseId) return res.status(400).json({ error: 'userId and courseId are required' });

  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!userExists) return res.status(404).json({ error: 'User not found' });

  const courseExists = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
  if (!courseExists) return res.status(404).json({ error: 'Course not found' });

  const now = new Date().toISOString();
  db.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)').run(userId, courseId, now);

  res.json({ success: true });
});

app.get('/api/reviews', (req, res) => {
  const courseId = parseIntSafe(req.query.courseId, null);

  const sql = courseId
    ? 'SELECT id, course_id, user_name, text, rating, created_at FROM reviews WHERE course_id = ? ORDER BY datetime(created_at) ASC, id ASC'
    : 'SELECT id, course_id, user_name, text, rating, created_at FROM reviews ORDER BY datetime(created_at) ASC, id ASC';

  const rows = courseId ? db.prepare(sql).all(courseId) : db.prepare(sql).all();

  const reviews = rows.map((row) => ({
    id: row.id,
    courseId: row.course_id,
    userName: row.user_name,
    text: row.text,
    rating: row.rating,
    createdAt: row.created_at,
  }));

  res.json(reviews);
});

app.post('/api/reviews', (req, res) => {
  const courseId = req.body?.courseId ? parseIntSafe(req.body.courseId, null) : null;
  const userName = cleanText(req.body?.userName);
  const text = cleanText(req.body?.text);
  const rating = Math.max(1, Math.min(5, parseIntSafe(req.body?.rating, 5) || 5));

  if (!userName || userName.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
  if (!text || text.length < 10) return res.status(400).json({ error: 'Review text must be at least 10 characters' });

  if (courseId) {
    const courseExists = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
    if (!courseExists) return res.status(404).json({ error: 'Course not found' });
  }

  const createdAt = new Date().toISOString();
  const result = db
    .prepare('INSERT INTO reviews (course_id, user_name, text, rating, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(courseId, userName, text, rating, createdAt);

  res.json({
    success: true,
    review: {
      id: Number(result.lastInsertRowid),
      courseId,
      userName,
      text,
      rating,
      createdAt,
    },
  });
});

app.get('/api/quizzes', (req, res) => {
  const rows = db.prepare('SELECT course_id, questions_json FROM quizzes ORDER BY course_id ASC').all();
  const quizzes = rows.map((row) => {
    let questions = [];
    try {
      questions = JSON.parse(row.questions_json);
    } catch {
      questions = ensureQuizQuestions([]);
    }
    return {
      courseId: row.course_id,
      questions,
    };
  });
  res.json(quizzes);
});

app.get('/api/quizzes/:courseId', (req, res) => {
  const courseId = parseIntSafe(req.params.courseId, null);
  if (!courseId) return res.status(400).json({ error: 'Invalid course id' });

  const row = db.prepare('SELECT course_id, questions_json FROM quizzes WHERE course_id = ?').get(courseId);
  if (!row) return res.status(404).json({ error: 'Quiz not found' });

  let questions = [];
  try {
    questions = JSON.parse(row.questions_json);
  } catch {
    questions = ensureQuizQuestions([]);
  }

  res.json({ courseId: row.course_id, questions });
});

app.get('/api/scores', (req, res) => {
  const userId = parseIntSafe(req.query.userId, null);

  const sql = userId
    ? 'SELECT user_id, user_name, course_id, score, total, percentage, date FROM scores WHERE user_id = ? ORDER BY datetime(date) DESC, id DESC'
    : 'SELECT user_id, user_name, course_id, score, total, percentage, date FROM scores ORDER BY datetime(date) DESC, id DESC';

  const rows = userId ? db.prepare(sql).all(userId) : db.prepare(sql).all();

  const scores = rows.map((row) => ({
    userId: row.user_id,
    userName: row.user_name,
    courseId: row.course_id,
    score: row.score,
    total: row.total,
    percentage: row.percentage,
    date: row.date,
  }));

  res.json(scores);
});

app.post('/api/scores', (req, res) => {
  const userId = parseIntSafe(req.body?.userId, 0) || 0;
  const userName = cleanText(req.body?.userName) || 'Guest';
  const courseId = parseIntSafe(req.body?.courseId, null);
  const score = parseIntSafe(req.body?.score, null);
  const total = parseIntSafe(req.body?.total, null);

  if (!courseId) return res.status(400).json({ error: 'courseId is required' });
  if (score === null || total === null || total <= 0 || score < 0 || score > total) {
    return res.status(400).json({ error: 'Invalid score payload' });
  }

  const courseExists = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
  if (!courseExists) return res.status(404).json({ error: 'Course not found' });

  const percentage = Math.round((score / total) * 100);
  const date = new Date().toISOString();

  db.prepare(`
    INSERT INTO scores (user_id, user_name, course_id, score, total, percentage, date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, course_id)
    DO UPDATE SET
      user_name = excluded.user_name,
      score = excluded.score,
      total = excluded.total,
      percentage = excluded.percentage,
      date = excluded.date
  `).run(userId, userName, courseId, score, total, percentage, date);

  res.json({
    success: true,
    entry: {
      userId,
      userName,
      courseId,
      score,
      total,
      percentage,
      date,
    },
  });
});

app.post('/api/telemetry/telegram-click', (req, res) => {
  db.prepare('UPDATE telemetry SET value = value + 1 WHERE key = ?').run('telegramClicks');
  const row = db.prepare('SELECT value FROM telemetry WHERE key = ?').get('telegramClicks');
  res.json({ success: true, telegramClicks: row?.value || 0 });
});

app.get('/api/admin/overview', (req, res) => {
  res.json(buildAdminOverview());
});

app.get('/api/export/users', async (req, res) => {
  try {
    const users = db
      .prepare(`
        SELECT
          u.id,
          u.name,
          u.phone,
          u.email,
          u.role,
          u.created_at,
          COALESCE(GROUP_CONCAT(e.course_id), '') AS enrolled_ids
        FROM users u
        LEFT JOIN enrollments e ON e.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC, u.id DESC
      `)
      .all();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Users');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 14 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 14 },
      { header: 'Registered', key: 'registeredAt', width: 28 },
      { header: 'Enrolled Count', key: 'enrolledCount', width: 16 },
      { header: 'Enrolled IDs', key: 'enrolledIds', width: 30 },
    ];

    users.forEach((row) => {
      const enrolled = parseEnrolledIds(row.enrolled_ids);
      sheet.addRow({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        role: row.role,
        registeredAt: row.created_at,
        enrolledCount: enrolled.length,
        enrolledIds: enrolled.join(', '),
      });
    });

    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export users error:', error.message);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

app.get('/api/export/full-report', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();

    const users = db
      .prepare(`
        SELECT
          u.id,
          u.name,
          u.phone,
          u.email,
          u.role,
          u.created_at,
          COALESCE(GROUP_CONCAT(e.course_id), '') AS enrolled_ids
        FROM users u
        LEFT JOIN enrollments e ON e.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC, u.id DESC
      `)
      .all();

    const usersSheet = workbook.addWorksheet('Users');
    usersSheet.columns = [
      { header: 'ID', key: 'id', width: 14 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 14 },
      { header: 'Registered', key: 'registeredAt', width: 28 },
      { header: 'Enrolled IDs', key: 'enrolledIds', width: 30 },
    ];

    users.forEach((row) => {
      usersSheet.addRow({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        role: row.role,
        registeredAt: row.created_at,
        enrolledIds: parseEnrolledIds(row.enrolled_ids).join(', '),
      });
    });

    const courses = db
      .prepare(`
        SELECT
          c.id,
          c.title_en,
          c.title_kz,
          c.desc_en,
          c.desc_kz,
          c.hero_type,
          c.img,
          c.video,
          cat.slug AS category,
          c.created_at,
          c.updated_at
        FROM courses c
        JOIN categories cat ON cat.id = c.category_id
        ORDER BY c.id ASC
      `)
      .all();

    const coursesSheet = workbook.addWorksheet('Courses');
    coursesSheet.columns = [
      { header: 'ID', key: 'id', width: 12 },
      { header: 'Title EN', key: 'titleEn', width: 34 },
      { header: 'Title KZ', key: 'titleKz', width: 34 },
      { header: 'Desc EN', key: 'descEn', width: 50 },
      { header: 'Desc KZ', key: 'descKz', width: 50 },
      { header: 'Category', key: 'category', width: 16 },
      { header: 'Hero Type', key: 'heroType', width: 16 },
      { header: 'Video', key: 'video', width: 50 },
      { header: 'Created', key: 'createdAt', width: 28 },
      { header: 'Updated', key: 'updatedAt', width: 28 },
    ];

    courses.forEach((row) => {
      coursesSheet.addRow({
        id: row.id,
        titleEn: row.title_en,
        titleKz: row.title_kz,
        descEn: row.desc_en,
        descKz: row.desc_kz,
        category: row.category,
        heroType: row.hero_type,
        video: row.video,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    });

    const scores = db
      .prepare('SELECT user_id, user_name, course_id, score, total, percentage, date FROM scores ORDER BY datetime(date) DESC, id DESC')
      .all();

    const scoresSheet = workbook.addWorksheet('Scores');
    scoresSheet.columns = [
      { header: 'User ID', key: 'userId', width: 12 },
      { header: 'User', key: 'userName', width: 24 },
      { header: 'Course ID', key: 'courseId', width: 12 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Total', key: 'total', width: 10 },
      { header: 'Percentage', key: 'percentage', width: 12 },
      { header: 'Date', key: 'date', width: 28 },
    ];

    scores.forEach((row) => {
      scoresSheet.addRow({
        userId: row.user_id,
        userName: row.user_name,
        courseId: row.course_id,
        score: row.score,
        total: row.total,
        percentage: row.percentage,
        date: row.date,
      });
    });

    const reviews = db
      .prepare('SELECT id, course_id, user_name, rating, text, created_at FROM reviews ORDER BY datetime(created_at) DESC, id DESC')
      .all();

    const reviewsSheet = workbook.addWorksheet('Reviews');
    reviewsSheet.columns = [
      { header: 'ID', key: 'id', width: 14 },
      { header: 'Course ID', key: 'courseId', width: 12 },
      { header: 'User', key: 'userName', width: 24 },
      { header: 'Rating', key: 'rating', width: 10 },
      { header: 'Text', key: 'text', width: 60 },
      { header: 'Created At', key: 'createdAt', width: 28 },
    ];

    reviews.forEach((row) => {
      reviewsSheet.addRow({
        id: row.id,
        courseId: row.course_id,
        userName: row.user_name,
        rating: row.rating,
        text: row.text,
        createdAt: row.created_at,
      });
    });

    const analyticsSheet = workbook.addWorksheet('Analytics');
    analyticsSheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 20 },
    ];

    const overview = buildAdminOverview();
    Object.entries(overview.stats).forEach(([metric, value]) => {
      analyticsSheet.addRow({ metric, value });
    });

    res.setHeader('Content-Disposition', 'attachment; filename=jsha-full-report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export full report error:', error.message);
    res.status(500).json({ error: 'Failed to export full report' });
  }
});

app.get('/api/export/analytics.json', (req, res) => {
  res.json(buildAdminOverview());
});


module.exports = app;

  try {
    const { startBot } = require('./bot.js');
    startBot();
  } catch (error) {
    console.error('Bot load error:', error.message);
  }

