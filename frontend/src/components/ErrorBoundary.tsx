import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time errors in the subtree and renders a fallback instead of
 * white-screening the whole app. React requires class components for error
 * boundaries; this is the sole sanctioned exception to the functional-only rule.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error', error, info.componentStack);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (fallback) return fallback(error, this.reset);

      return (
        <div className="card" role="alert" style={{ margin: '1.5rem', padding: '1.5rem' }}>
          <div className="card-header"><strong>Something went wrong</strong></div>
          <p style={{ marginTop: '0.75rem', color: 'var(--muted)' }}>{error.message}</p>
          <button type="button" className="btn btn-primary" onClick={this.reset} style={{ marginTop: '1rem' }}>
            Try again
          </button>
        </div>
      );
    }

    return children;
  }
}
