import React, { Component, ErrorInfo, ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  children?: ReactNode;
}

interface InternalProps extends Props {
    t: (key: string) => string;
}

interface State {
  hasError: boolean;
}

class ErrorBoundaryInternal extends Component<InternalProps, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
                <p className="text-gray-600 mb-6">
                    {this.props.t('common.errorBoundaryMessage')}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    {this.props.t('common.refresh')}
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ErrorBoundary(props: Props) {
    const { t } = useTranslation();
    return <ErrorBoundaryInternal t={t} {...props} />;
}
