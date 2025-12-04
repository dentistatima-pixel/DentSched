import React, { ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { 
    hasError: false, 
    error: null 
  };

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
          <h1>Something went wrong.</h1>
          <p>Please refresh the page.</p>
          <pre style={{textAlign: 'left', background: '#f0f0f0', padding: 20, borderRadius: 8, overflow: 'auto', fontSize: '12px'}}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

// Force a log to ensure the preview detected the change
console.log("App mounted. Version 11 Refresh.");

const root = ReactDOM.createRoot(rootElement);
// We add a key to App to force a full re-mount when this file is updated, 
// ensuring the new constants are picked up by useState.
root.render(
  <React.StrictMode>
    <ErrorBoundary>
        <App key="refresh-v11-medical-fix" />
    </ErrorBoundary>
  </React.StrictMode>
);