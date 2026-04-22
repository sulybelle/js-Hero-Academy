import { useCallback, useRef, useState, useEffect } from 'react';
import { api } from '../lib/api';

/**
 * Simple in-memory cache for API responses
 * Lab 6: HTTP Caching and Optimization
 */
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const cached = apiCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    apiCache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCached(key, data) {
  apiCache.set(key, { data, timestamp: Date.now() });
}

export function clearApiCache(key) {
  if (key) {
    apiCache.delete(key);
  } else {
    apiCache.clear();
  }
}

/**
 * Hook for API operations with caching and request deduplication
 * Lab 6: Advanced API Integration
 * 
 * @returns {Object} API methods with loading states
 */
export function useApi() {
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  
  // Track pending requests for deduplication
  const pendingRequests = useRef(new Map());
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Generic API call wrapper with loading state management
  const callApi = useCallback(async (key, apiFn, options = {}) => {
    const { 
      useCache = false, 
      cacheKey = null,
      showLoading = true,
      onSuccess,
      onError,
    } = options;

    const actualCacheKey = cacheKey || key;

    // Check cache first
    if (useCache) {
      const cached = getCached(actualCacheKey);
      if (cached) {
        onSuccess?.(cached);
        return { success: true, data: cached, fromCache: true };
      }
    }

    // Check for pending request (deduplication)
    if (pendingRequests.current.has(key)) {
      const result = await pendingRequests.current.get(key);
      return result;
    }

    // Create the promise
    const requestPromise = (async () => {
      if (showLoading && isMounted.current) {
        setLoading((prev) => ({ ...prev, [key]: true }));
        setErrors((prev) => ({ ...prev, [key]: null }));
      }

      try {
        const result = await apiFn();

        if (isMounted.current) {
          if (useCache) {
            setCached(actualCacheKey, result);
          }
          onSuccess?.(result);
        }

        return { success: true, data: result };
      } catch (error) {
        if (isMounted.current) {
          setErrors((prev) => ({ ...prev, [key]: error.message }));
          onError?.(error);
        }
        return { success: false, error };
      } finally {
        if (showLoading && isMounted.current) {
          setLoading((prev) => ({ ...prev, [key]: false }));
        }
        pendingRequests.current.delete(key);
      }
    })();

    pendingRequests.current.set(key, requestPromise);
    return requestPromise;
  }, []);

  // Specific API methods
  const getUsers = useCallback((options) => 
    callApi('users', api.getUsers, options), [callApi]);
  
  const login = useCallback((payload, options) => 
    callApi('login', () => api.login(payload), options), [callApi]);
  
  const register = useCallback((payload, options) => 
    callApi('register', () => api.register(payload), options), [callApi]);
  
  const getCourses = useCallback((options) => 
    callApi('courses', api.getCourses, { ...options, useCache: true, cacheKey: 'courses' }), [callApi]);
  
  const getReviews = useCallback((courseId, options) => 
    callApi(`reviews-${courseId || 'all'}`, () => api.getReviews(courseId), options), [callApi]);
  
  const addReview = useCallback((payload, options) => 
    callApi('addReview', () => api.addReview(payload), options), [callApi]);
  
  const enroll = useCallback((payload, options) => 
    callApi('enroll', () => api.enroll(payload), options), [callApi]);
  
  const getQuizzes = useCallback((options) => 
    callApi('quizzes', api.getQuizzes, { ...options, useCache: true, cacheKey: 'quizzes' }), [callApi]);
  
  const getQuiz = useCallback((courseId, options) => 
    callApi(`quiz-${courseId}`, () => api.getQuiz(courseId), options), [callApi]);
  
  const getScores = useCallback((userId, options) => 
    callApi(`scores-${userId || 'all'}`, () => api.getScores(userId), options), [callApi]);
  
  const addScore = useCallback((payload, options) => 
    callApi('addScore', () => api.addScore(payload), options), [callApi]);
  
  const getAdminOverview = useCallback((options) => 
    callApi('adminOverview', api.getAdminOverview, options), [callApi]);

  const isLoading = useCallback((key) => !!loading[key], [loading]);
  const getError = useCallback((key) => errors[key] || null, [errors]);
  const clearError = useCallback((key) => {
    setErrors((prev) => ({ ...prev, [key]: null }));
  }, []);

  return {
    // Loading and error states
    loading,
    errors,
    isLoading,
    getError,
    clearError,
    
    // API methods
    getUsers,
    login,
    register,
    getCourses,
    getReviews,
    addReview,
    enroll,
    getQuizzes,
    getQuiz,
    getScores,
    addScore,
    getAdminOverview,
    
    // Utilities
    clearCache: clearApiCache,
  };
}

/**
 * Hook for optimistic updates
 * Lab 6: Advanced UX Patterns
 */
export function useOptimisticUpdate() {
  const [optimisticData, setOptimisticData] = useState(null);
  const [pending, setPending] = useState(false);

  const execute = useCallback(async (optimisticValue, apiCall, { onSuccess, onError, onRollback } = {}) => {
    const previousValue = optimisticData;
    
    // Apply optimistic update
    setOptimisticData(optimisticValue);
    setPending(true);

    try {
      const result = await apiCall();
      onSuccess?.(result);
      return { success: true, data: result };
    } catch (error) {
      // Rollback on error
      setOptimisticData(previousValue);
      onError?.(error);
      onRollback?.(previousValue);
      return { success: false, error };
    } finally {
      setPending(false);
    }
  }, [optimisticData]);

  return {
    data: optimisticData,
    pending,
    execute,
    reset: () => setOptimisticData(null),
  };
}

export default useApi;
