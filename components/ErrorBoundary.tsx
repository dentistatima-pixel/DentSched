import React, { ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Fix: Replaced class property state initialization with a constructor.
  // The explicit call to `super(props)` ensures that `this.props` is correctly
  // typed and initialized, resolving the error where the 'props' property was
  // not found on the component instance.
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

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong in this component.</h1>
          <p>Other parts of the application may still be functional.</p>
        </div>
      );
    }

    return this.props.children ?? null;
  }
}
