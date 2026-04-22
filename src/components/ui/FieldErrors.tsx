import { useTranslation } from "react-i18next";

type Props = {
  fieldErrors: Record<string, string>;
  knownFields: string[];
  testId?: string;
};

export default function FieldErrors({ fieldErrors, knownFields, testId }: Props) {
  const { t } = useTranslation();
  const unknown = Object.entries(fieldErrors).filter(
    ([key]) => !knownFields.includes(key),
  );
  if (unknown.length === 0) return null;
  return (
    <ul
      role="group"
      aria-label={t("errors.validation.title")}
      data-testid={testId ?? "field-errors"}
      className="mt-2 space-y-1 font-body text-sm text-red-600 list-disc list-inside"
    >
      {unknown.map(([key, message]) => (
        <li key={key}>
          <span className="font-mono text-xs text-red-800">{key}</span>: {message}
        </li>
      ))}
    </ul>
  );
}
