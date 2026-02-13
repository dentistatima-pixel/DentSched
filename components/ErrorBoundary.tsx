import React, { ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Added a constructor to initialize state. This ensures `this.state` is available before `render` is called, resolving errors where it was used before being defined.
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: 'center', fontFamily: 'sans-serif', color: 'var(--text-primary)' }}>
          <h1>Something went wrong.</h1>
          <p style={{ color: 'var(--text-secondary)' }}>An error occurred in this section of the application. Other areas may still be functional.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
