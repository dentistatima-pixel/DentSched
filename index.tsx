import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
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
import { SearchProvider } from './contexts/SearchContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
        <ToastProvider>
            <AppProvider>
                <SettingsProvider>
                  <SearchProvider>
                      <ModalProvider>
                        <PatientProvider>
                            <StaffProvider>
                                <AppointmentProvider>
                                    <InventoryProvider>
                                        <FinancialProvider>
                                            <ClinicalOpsProvider>
                                              <Router>
                                                  <App />
                                              </Router>
                                            </ClinicalOpsProvider>
                                        </FinancialProvider>
                                    </InventoryProvider>
                                </AppointmentProvider>
                            </StaffProvider>
                        </PatientProvider>
                      </ModalProvider>
                  </SearchProvider>
                </SettingsProvider>
            </AppProvider>
        </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);