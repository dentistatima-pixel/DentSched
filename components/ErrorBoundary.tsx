import React, { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// FIX: Explicitly import Component and extend it to ensure correct type resolution of this.props in some environments
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Replaced constructor with a class property for state initialization.
  // This is a more modern approach and can resolve issues where `this.state`
  // is not being recognized correctly in some build environments.
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong in this component.</h1>
          <p>Other parts of the application may still be functional.</p>
        </div>
      );
    }

    // FIX: Accessing children via this.props, which is now correctly recognized as inherited from Component
    return this.props.children || null;
  }
}
