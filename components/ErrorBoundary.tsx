import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Component to catch and handle errors in its child component tree.
 */
// Fix: Use React.Component explicitly to ensure inheritance is correctly identified by the compiler.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  
  // Fix: Declare and initialize state as a class property for better TypeScript inference and to resolve property access errors.
  public state: ErrorBoundaryState = { hasError: false, error: null };

  // Removed constructor initialization of state to resolve property access errors in the constructor scope.

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  render() {
    // Fix: Access state through 'this.state' which is correctly provided by the React.Component base class.
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{ padding: 20, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong in this component.</h1>
          <p>Other parts of the application may still be functional.</p>
        </div>
      );
    }

    // Fix: Access props through 'this.props' which is correctly typed via inheritance from React.Component.
    return this.props.children || null;
  }
}
