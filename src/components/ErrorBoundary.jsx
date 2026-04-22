import React from 'react';
import AppLink from './AppLink';

/**
 * Error Boundary Component
 * Lab 6: Error Handling in React Applications
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Send to error reporting service if configured
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { fallback, maxErrors = 3, children } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback({
          error,
          errorInfo,
          errorCount,
          reset: this.handleReset,
          reload: this.handleReload,
        });
      }

      // Default error UI
      const isMaxErrors = errorCount >= maxErrors;

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p className="error-message">
              {error?.message || 'An unexpected error occurred'}
            </p>
            
            {process.env.NODE_ENV === 'development' && errorInfo && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-stack">
                  {error?.toString?.()}\n{errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              {!isMaxErrors ? (
                <button 
                  className="btn btn-primary" 
                  onClick={this.handleReset}
                  type="button"
                >
                  Try Again
                </button>
              ) : (
                <button 
                  className="btn btn-primary" 
                  onClick={this.handleReload}
                  type="button"
                >
                  Reload Page
                </button>
              )}
              
              <AppLink to="/" className="btn btn-secondary">
                Go Home
              </AppLink>
            </div>

            {isMaxErrors && (
              <p className="error-warning">
                Too many consecutive errors. Please reload the page.
              </p>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Async Error Boundary for handling async errors
 * Lab 6: Async Error Handling Pattern
 */
export function AsyncErrorBoundary({ children, onError }) {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      setError(event.reason);
      onError?.(event.reason);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  if (error) {
    return (
      <div className="async-error">
        <p>An async error occurred: {error.message || 'Unknown error'}</p>
        <button 
          className="btn btn-primary" 
          onClick={() => setError(null)}
          type="button"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return children;
}

export default ErrorBoundary;
