async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof body === 'object' && body?.error ? body.error : `Request failed: ${res.status}`;
    throw new Error(message);
  }

  return body;
}

export const api = {
  getUsers: () => request('/api/users'),
  register: (payload) => request('/api/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/api/login', { method: 'POST', body: JSON.stringify(payload) }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),

  getCourses: () => request('/api/courses'),
  addCourse: (payload) => request('/api/courses', { method: 'POST', body: JSON.stringify(payload) }),
  updateCourse: (id, payload) => request(`/api/courses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCourse: (id) => request(`/api/courses/${id}`, { method: 'DELETE' }),
  enroll: (payload) => request('/api/enroll', { method: 'POST', body: JSON.stringify(payload) }),

  getReviews: (courseId) => request(courseId ? `/api/reviews?courseId=${courseId}` : '/api/reviews'),
  addReview: (payload) => request('/api/reviews', { method: 'POST', body: JSON.stringify(payload) }),

  getQuizzes: () => request('/api/quizzes'),
  getQuiz: (courseId) => request(`/api/quizzes/${courseId}`),

  getScores: (userId) => request(userId ? `/api/scores?userId=${userId}` : '/api/scores'),
  addScore: (payload) => request('/api/scores', { method: 'POST', body: JSON.stringify(payload) }),

  getAdminOverview: () => request('/api/admin/overview'),
};
