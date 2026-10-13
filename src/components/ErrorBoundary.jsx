import React from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  componentDidUpdate(prevProps) {
    // Automatically reset error boundary if pathname or resetKey changes
    if (this.props.resetKey && prevProps.resetKey !== this.props.resetKey) {
      if (this.state.hasError) {
        this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || String(this.state.error) || 'An unexpected error occurred.';
      
      return (
        <div className="container-fluid py-4">
          <div 
            className="p-4 rounded-3 border"
            style={{
              background: '#0f172a',
              borderColor: 'rgba(239, 68, 68, 0.35)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              maxWidth: '850px',
              margin: '2rem auto'
            }}
          >
            <div className="d-flex align-items-start gap-3 mb-3">
              <div 
                className="p-2.5 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
              >
                <AlertTriangle size={28} />
              </div>
              <div className="flex-grow-1">
                <h4 className="text-white fw-bold mb-1 fs-5">
                  Unable to Display This Module
                </h4>
                <p className="text-secondary mb-0 fs-6">
                  A component error occurred while rendering this view. You can reload the page or navigate back to the Dashboard safely.
                </p>
              </div>
            </div>

            <div 
              className="p-3 rounded-2 mb-3 font-monospace fs-7 text-danger border border-danger border-opacity-25"
              style={{ background: 'rgba(0, 0, 0, 0.4)', wordBreak: 'break-word' }}
            >
              <strong>Error:</strong> {errorMessage}
            </div>

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top border-secondary border-opacity-25">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-info d-flex align-items-center gap-1.5 fw-semibold"
                  onClick={this.handleRetry}
                >
                  <RefreshCw size={14} /> Try Again
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 text-light"
                  onClick={this.handleReload}
                >
                  Reload Page
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 text-light"
                  onClick={this.handleGoHome}
                >
                  <Home size={14} /> Dashboard
                </button>
              </div>

              {this.state.errorInfo && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-secondary text-decoration-none p-0 d-flex align-items-center gap-1 fs-8"
                  onClick={this.toggleDetails}
                >
                  {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {this.state.showDetails ? 'Hide Stack Trace' : 'View Stack Trace'}
                </button>
              )}
            </div>

            {this.state.showDetails && this.state.errorInfo && (
              <pre 
                className="mt-3 p-3 rounded bg-black text-secondary fs-8 overflow-auto border border-secondary border-opacity-25"
                style={{ maxHeight: '250px' }}
              >
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
