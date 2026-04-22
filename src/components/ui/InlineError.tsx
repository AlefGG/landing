import { useTranslation } from "react-i18next";
import { errorMessage, type NormalizedError } from "../../services/errors";

type Props = {
  error: NormalizedError;
  overrideKey?: string;
  className?: string;
  testId?: string;
};

export default function InlineError({
  error,
  overrideKey,
  className,
  testId,
}: Props) {
  const { t } = useTranslation();
  const text = errorMessage(error, t, overrideKey, "short");
  return (
    <p
      role="alert"
      data-testid={testId ?? "inline-error"}
      data-error-kind={error.kind}
      className={
        className ?? "font-body text-sm leading-4 text-red-600"
      }
    >
      {text}
    </p>
  );
}
