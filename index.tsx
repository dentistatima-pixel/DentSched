import React, { Component, ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/ToastSystem';
import { DataProvider } from './dataContext';
import { AppProvider } from './contexts/AppContext';
import { PatientProvider } from './contexts/PatientContext';
import { AppointmentProvider } from './contexts/AppointmentContext';

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

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

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

    return (this as any).props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
        <ToastProvider>
            <AppProvider>
                <PatientProvider>
                    <AppointmentProvider>
                        <DataProvider>
                            <App key="refresh-v16-features" />
                        </DataProvider>
                    </AppointmentProvider>
                </PatientProvider>
            </AppProvider>
        </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);