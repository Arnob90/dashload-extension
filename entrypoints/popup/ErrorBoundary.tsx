import React from 'react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[Dashload] ErrorBoundary caught:', error, errorInfo.componentStack);
    }

    override render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h2>Something went wrong</h2>
                    <p>The app encountered an unexpected error and couldn't start.</p>
                    {this.state.error && (
                        <pre className="error-detail">{this.state.error.message}</pre>
                    )}
                    <button
                        className="retry-btn"
                        onClick={() => window.location.reload()}
                    >
                        Reload App
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;