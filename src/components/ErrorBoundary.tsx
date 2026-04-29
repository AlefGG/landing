import { Component, type ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { withTranslation, type WithTranslation } from "react-i18next";

type Props = WithTranslation & {
  children?: ReactNode;
};

type State = {
  hasError: boolean;
};

class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: { componentStack?: string | null }) {
    Sentry.captureException(error, {
      contexts: errorInfo.componentStack
        ? { react: { componentStack: errorInfo.componentStack } }
        : undefined,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      const { t } = this.props;
      return (
        <div
          role="alert"
          className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center"
        >
          <h1 className="font-display text-2xl text-neutral-900">
            {t("errorBoundary.title")}
          </h1>
          <p className="font-body text-base text-neutral-700">
            {t("errorBoundary.description")}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-[8px] bg-cta-main px-6 py-3 font-body text-base font-semibold text-white"
          >
            {t("errorBoundary.reload")}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
