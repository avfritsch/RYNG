import { Component, type ReactNode } from 'react';
import '../../styles/error-boundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="error-boundary">
          <h2 className="error-boundary-title">Etwas ist schiefgelaufen</h2>
          <p className="error-boundary-message">{this.state.error.message}</p>
          <button
            className="error-boundary-btn"
            onClick={() => {
              this.setState({ error: null });
              window.location.href = '/';
            }}
          >
            Zur Startseite
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
