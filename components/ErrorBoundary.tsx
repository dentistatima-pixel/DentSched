import React, { Component, ErrorInfo, ReactNode } from 'react';

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
// Fix: Extending Component directly from 'react' and providing a constructor ensures that 'this.props' and 'this.state' are correctly typed and available.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  
  // Fix: Explicitly declare and initialize state as a class property for better TypeScript inference.
  public state: ErrorBoundaryState = { hasError: false, error: null };

  // Fix: Added constructor with super(props) to explicitly link props to the component instance, resolving the property access error.
  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  render() {
    // Access state through 'this.state' which is correctly inherited.
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{ padding: 20, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong in this component.</h1>
          <p>Other parts of the application may still be functional.</p>
        </div>
      );
    }

    // Fix: Accessing 'this.props.children' from the Component base class, now correctly recognized by the compiler.
    return this.props.children || null;
  }
}
