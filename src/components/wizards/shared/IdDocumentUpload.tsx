import { useCallback, useId, useRef, useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";

export type IdDocumentUploadProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  label: string;
  error?: string;
  accept?: string;
};

const DEFAULT_ACCEPT = "image/jpeg,image/png,application/pdf";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export default function IdDocumentUpload({
  value,
  onChange,
  label,
  error,
  accept = DEFAULT_ACCEPT,
}: IdDocumentUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const labelId = useId();
  const [dragOver, setDragOver] = useState(false);

  const handlePick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const onDragLeave = useCallback(() => setDragOver(false), []);
  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0] ?? null;
      if (file) onChange(file);
    },
    [onChange],
  );

  return (
    <div className="flex flex-col gap-2 w-full lg:w-[280px]">
      <span id={labelId} className="font-body text-xl leading-6 text-neutral-600">
        {label}
      </span>
      {value ? (
        <div
          aria-labelledby={labelId}
          className="flex items-center justify-between gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2"
        >
          <div className="flex flex-col min-w-0">
            <span className="font-body text-sm leading-4 text-neutral-900 truncate">
              {value.name}
            </span>
            <span className="font-body text-xs leading-4 text-neutral-500">
              {formatBytes(value.size)}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePick}
              className="font-body text-sm leading-4 text-cta-main hover:underline"
            >
              {t("wizard.contacts.idDocument.replace")}
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="font-body text-sm leading-4 text-red-600 hover:underline"
              aria-label={t("wizard.contacts.idDocument.remove")}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-labelledby={labelId}
          onClick={handlePick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handlePick();
            }
          }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-3 py-6 cursor-pointer transition-colors ${
            error
              ? "border-red-500 bg-red-50"
              : dragOver
                ? "border-cta-main bg-cta-main/5"
                : "border-neutral-300 hover:border-cta-main"
          }`}
        >
          <span className="font-body text-sm leading-5 text-neutral-700 text-center">
            {t("wizard.contacts.idDocument.dropzone")}
          </span>
          <span className="font-body text-xs leading-4 text-neutral-500">
            JPG, PNG, PDF · ≤5 MB
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        aria-labelledby={labelId}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {error && (
        <p role="alert" className="font-body text-sm leading-4 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
