import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Reverted to constructor-based state initialization to address a potential
  //      tooling issue where class properties might not be correctly handled,
  //      leading to incorrect type inference for 'this.props'.
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render(): ReactNode {
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
