import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for data fetching with loading, error, and retry support
 * Lab 6: HTTP Requests and Async Operations
 * 
 * @param {Function} fetchFn - Async function that returns data
 * @param {Array} deps - Dependency array for re-fetching
 * @param {Object} options - Configuration options
 * @returns {Object} { data, loading, error, refetch, abort }
 */
export function useFetch(fetchFn, deps = [], options = {}) {
  const {
    immediate = true,
    initialData = null,
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);

  // Update fetch function reference
  fetchFnRef.current = fetchFn;

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await fetchFnRef.current(abortControllerRef.current.signal);

      if (isMountedRef.current) {
        setData(result);
        setError(null);
        setRetryAttempt(0);
        onSuccess?.(result);
      }

      return { success: true, data: result };
    } catch (err) {
      // Don't treat abort as error
      if (err.name === 'AbortError') {
        return { success: false, aborted: true };
      }

      if (isMountedRef.current) {
        setError(err.message || 'Request failed');
        onError?.(err);

        // Auto-retry logic
        if (retryAttempt < retryCount) {
          setTimeout(() => {
            if (isMountedRef.current) {
              setRetryAttempt((prev) => prev + 1);
            }
          }, retryDelay * (retryAttempt + 1));
        }
      }

      return { success: false, error: err };
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [retryAttempt, retryCount, retryDelay, onSuccess, onError]);

  // Manual refetch function
  const refetch = useCallback(() => {
    setRetryAttempt(0);
    return execute();
  }, [execute]);

  // Abort current request
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Execute on mount and when dependencies change
  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    loading,
    error,
    refetch,
    abort,
    retryAttempt,
    hasMoreRetries: retryAttempt < retryCount,
  };
}

/**
 * Hook for paginated data fetching
 * Lab 6: Advanced HTTP Patterns
 */
export function usePaginatedFetch(fetchFn, options = {}) {
  const { pageSize = 10, initialPage = 1 } = options;

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (pageNum, signal) => {
    const result = await fetchFn(pageNum, pageSize, signal);
    return result;
  }, [fetchFn, pageSize]);

  const { data, loading, error, refetch } = useFetch(
    (signal) => fetchPage(page, signal),
    [page],
    { ...options, immediate: true }
  );

  // Update items when data changes
  useEffect(() => {
    if (data) {
      if (page === initialPage) {
        setItems(data.items || data);
      } else {
        setItems((prev) => [...prev, ...(data.items || data)]);
      }
      setHasMore((data.items || data).length === pageSize);
    }
  }, [data, page, initialPage, pageSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    setPage((prev) => prev + 1);
    setLoadingMore(false);
  }, [loadingMore, hasMore]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setItems([]);
    setHasMore(true);
    refetch();
  }, [initialPage, refetch]);

  return {
    items,
    loading: loading && page === initialPage,
    loadingMore,
    error,
    hasMore,
    page,
    loadMore,
    reset,
    refetch,
  };
}

export default useFetch;
