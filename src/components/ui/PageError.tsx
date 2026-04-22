import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { errorMessage, type NormalizedError } from "../../services/errors";
import Button from "./Button";

type Props = {
  error: NormalizedError;
  overrideKey?: string;
  onRetry?: () => void;
  backHref?: string;
};

export default function PageError({ error, overrideKey, onRetry, backHref }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const title = errorMessage(error, t, overrideKey, "title");
  const hint = errorMessage(error, t, overrideKey, "hint");

  const isAuth = error.kind === "auth";
  const loginHref = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;

  return (
    <div
      role="alert"
      data-testid="page-error"
      data-error-kind={error.kind}
      className="rounded-[12px] border border-neutral-200 bg-white p-6 lg:p-10 my-4"
    >
      <h2 className="font-display text-lg lg:text-xl font-semibold text-neutral-900 mb-2">
        {title}
      </h2>
      <p className="font-body text-sm lg:text-base text-neutral-600 mb-4">{hint}</p>
      <div className="flex flex-wrap gap-3">
        {isAuth ? (
          <Button variant="cta" size="md" href={loginHref} data-testid="page-error-login">
            {t("errors.goLogin")}
          </Button>
        ) : (
          <>
            {onRetry && (
              <Button
                variant="cta"
                size="md"
                onClick={onRetry}
                data-testid="page-error-retry"
              >
                {t("errors.retry")}
              </Button>
            )}
            {backHref && (
              <Link
                to={backHref}
                data-testid="page-error-back"
                className="inline-flex items-center font-body text-sm font-semibold text-cta-main hover:underline px-4 py-2"
              >
                {t("errors.goBack")}
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
