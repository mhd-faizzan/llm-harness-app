import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to the console for local debugging; a real deployment would
    // forward this to an error reporter.
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold">Something broke on this screen.</h1>
          <p className="mt-2 text-sm text-muted">
            The error was logged to the console. Reloading usually clears it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
