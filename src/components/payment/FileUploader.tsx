import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ALLOWED_PAYMENT_MIME,
  PaymentUploadError,
  validatePaymentFile,
  type PaymentValidationError,
} from "../../services/paymentService";
import { normalizeError } from "../../services/errors";

type UploaderProps = {
  title: string;
  hint: string;
  onUpload: (file: File) => Promise<void>;
  testId?: string;
};

const ACCEPT_ATTR = ALLOWED_PAYMENT_MIME.join(",");

export default function FileUploader({
  title,
  hint,
  onUpload,
  testId,
}: UploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<PaymentValidationError | "uploadFailed" | "notConfigured" | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next = files[0]!;
    const err = validatePaymentFile(next);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setError(null);
    setFile(next);
  }, []);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const reset = () => {
    setFile(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onUpload(file);
    } catch (err) {
      if (err instanceof PaymentUploadError) {
        setError(err.code);
        setErrorDetail(err.detail ?? null);
      } else {
        const normalized = normalizeError(err);
        setError("uploadFailed");
        setErrorDetail(
          normalized.kind === "network"
            ? t("errors.network.short")
            : normalized.detail ?? null,
        );
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4" data-testid={testId}>
      <div>
        <h3 className="font-heading text-[20px] lg:text-[24px] font-extrabold leading-[24px] lg:leading-[28px] text-neutral-900">
          {title}
        </h3>
        <p className="mt-1 font-body text-sm lg:text-base leading-4 lg:leading-6 text-neutral-500">
          {hint}
        </p>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`rounded-[12px] border-2 border-dashed px-6 py-8 text-center transition-colors ${
          isDragging
            ? "border-cta-main bg-cta-main-soft"
            : "border-neutral-300 bg-white"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          onChange={onInputChange}
          className="hidden"
          data-testid={testId ? `${testId}-input` : undefined}
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <p className="font-body text-base leading-6 text-neutral-900 break-all">
              {t("payment.uploader.selected", { name: file.name })}
            </p>
            <button
              type="button"
              onClick={reset}
              disabled={submitting}
              className="font-body text-sm leading-4 text-cta-main underline disabled:opacity-50"
            >
              {t("payment.uploader.remove")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={openPicker}
              className="bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white font-body font-semibold text-base leading-6 rounded-[40px] px-8 py-3"
            >
              {t("payment.uploader.choose")}
            </button>
            <p className="font-body text-sm leading-4 text-neutral-500">
              {t("payment.uploader.drop")}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p
          className="font-body text-sm leading-4 text-red-600"
          role="alert"
        >
          {t(`payment.errors.${error}`)}
          {errorDetail ? ` — ${errorDetail}` : null}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!file || submitting}
        className="self-start bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white font-body font-semibold text-base leading-6 rounded-[40px] px-10 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? t("payment.uploader.submitting") : t("payment.uploader.submit")}
      </button>
    </div>
  );
}
