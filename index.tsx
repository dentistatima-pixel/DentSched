
import React, { Component, ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/ToastSystem';
import { AppProvider } from './contexts/AppContext';
import { ModalProvider } from './contexts/ModalContext';
import { PatientProvider } from './contexts/PatientContext';
import { AppointmentProvider } from './contexts/AppointmentContext';
import { StaffProvider } from './contexts/StaffContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { FinancialProvider } from './contexts/FinancialContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ClinicalOpsProvider } from './contexts/ClinicalOpsContext';
import { Router } from './contexts/RouterContext';

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

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // In a real production app, this would send a report to a service 
    // like Sentry, LogRocket, or a custom backend endpoint.
    console.log("SIMULATING: Sending error to remote logging service...", {
      error: error.toString(),
      stack: errorInfo.componentStack,
    });
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Also log to console for development
    console.error("Uncaught error:", error, errorInfo);
    // Send to conceptual remote logging service
    this.logErrorToService(error, errorInfo);
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
                <SettingsProvider>
                  <ModalProvider>
                    <PatientProvider>
                        <AppointmentProvider>
                            <StaffProvider>
                                <InventoryProvider>
                                    <FinancialProvider>
                                        <ClinicalOpsProvider>
                                          <Router>
                                              <App />
                                          </Router>
                                        </ClinicalOpsProvider>
                                    </FinancialProvider>
                                </InventoryProvider>
                            </StaffProvider>
                        </AppointmentProvider>
                    </PatientProvider>
                  </ModalProvider>
                </SettingsProvider>
            </AppProvider>
        </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
