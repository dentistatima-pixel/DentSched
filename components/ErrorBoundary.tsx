import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: The errors indicate that `this.state` and `this.props` are not recognized on the component. In a class component, it is essential to call `super(props)` inside the constructor to initialize `this.props`. State should also be initialized in the constructor. This change adds a proper constructor to correctly initialize the component's state and props, resolving the type errors.
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
