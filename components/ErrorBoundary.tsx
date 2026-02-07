import React, { ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary class component to catch JavaScript errors anywhere in their child component tree.
 */
// Fixed: Explicitly extend React.Component with proper generics to ensure props and state are correctly typed
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Fixed: Initializing state via constructor to ensure proper type inference for 'this' context across all environments
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console for debugging purposes
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI displayed when a component in the tree crashes
      return (
        <div style={{ padding: 20, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong in this component.</h1>
          <p>Other parts of the application may still be functional.</p>
        </div>
      );
    }

    // Fixed: Accessing children from this.props which is inherited from React.Component
    return this.props.children || null;
  }
}
