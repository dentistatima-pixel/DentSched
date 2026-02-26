import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Using a class property to initialize state. This is a more modern
  // approach than using a constructor and avoids potential TypeScript errors
  // with 'this' context or strict property initialization rules.
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 m-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-200/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Something went wrong</h1>
          <p className="text-slate-500 font-medium max-w-md mb-8 leading-relaxed">
            An unexpected error occurred in this section. Don't worry, your other data is safe.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all active:scale-95"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-lilac-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-lilac-700 shadow-xl shadow-lilac-600/30 transition-all active:scale-95"
            >
              Reload App
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-12 p-6 bg-slate-900 text-red-400 text-left text-[10px] font-mono rounded-2xl overflow-auto max-w-full border border-slate-800">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
