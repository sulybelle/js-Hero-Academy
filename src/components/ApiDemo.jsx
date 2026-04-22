import { useState } from 'react';
import { useFetch, useApi } from '../hooks';
import SpinnerOverlay from './SpinnerOverlay';

export default function ApiDemo() {
   const {
    data: courses,
    loading: coursesLoading,
    error: coursesError,
    refetch: refetchCourses,
  } = useFetch(
    async (signal) => {
      const res = await fetch('/api/courses', { signal });
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    },
    [],
    { retryCount: 2, retryDelay: 1000 }
  );

  const api = useApi();
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleLoadReviews = async (courseId) => {
    setSelectedCourse(courseId);
    const result = await api.getReviews(courseId);
    console.log('Reviews loaded:', result);
  };

  return (
    <div className="api-demo">
      <h2>Lab 6: HTTP Requests Demo</h2>

      <section className="demo-section">
        <h3>1. useFetch Hook with Retry</h3>
        <p>Fetches courses with automatic retry on failure (2 retries)</p>

        {coursesLoading && <p className="loading-text">Loading courses...</p>}

        {coursesError && (
          <div className="error-box">
            <p>Error: {coursesError}</p>
            <button onClick={refetchCourses} className="btn btn-primary">
              Retry
            </button>
          </div>
        )}

        {courses && (
          <div className="data-display">
            <p>✅ Loaded {courses.length} courses</p>
            <button onClick={refetchCourses} className="btn btn-secondary">
              Refetch
            </button>
          </div>
        )}
      </section>

      <section className="demo-section">
        <h3>2. useApi Hook with Caching</h3>
        <p>API methods with built-in caching and deduplication</p>

        <div className="api-buttons">
          <button
            onClick={() => api.getCourses()}
            disabled={api.isLoading('courses')}
            className="btn btn-primary"
          >
            {api.isLoading('courses') ? 'Loading...' : 'Get Courses (Cached)'}
          </button>

          <button
            onClick={() => handleLoadReviews(null)}
            disabled={api.isLoading('reviews-all')}
            className="btn btn-secondary"
          >
            {api.isLoading('reviews-all') ? 'Loading...' : 'Get Reviews'}
          </button>

          <button
            onClick={() => api.clearCache()}
            className="btn btn-secondary"
          >
            Clear Cache
          </button>
        </div>

        {api.getError('courses') && (
          <p className="error-text">Courses error: {api.getError('courses')}</p>
        )}
      </section>

      <section className="demo-section">
        <h3>3. Async/Await Pattern</h3>
        <pre className="code-block">
          {`// Lab 6: HTTP Request Pattern
const fetchData = async () => {
  try {
    setLoading(true);
    const response = await fetch('/api/data');
    
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    
    const data = await response.json();
    setData(data);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};`}
        </pre>
      </section>

      <SpinnerOverlay visible={coursesLoading} text="Fetching data..." />
    </div>
  );
}
