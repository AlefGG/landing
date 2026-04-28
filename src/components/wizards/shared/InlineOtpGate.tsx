import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, InlineError } from "../../ui";
import { useAuth } from "../../../contexts/AuthContext";
import { normalizeError, type NormalizedError } from "../../../services/errors";
import { formatPhone } from "./phoneFormat";
import OtpCodeForm from "./OtpCodeForm";

export type InlineOtpGateProps = {
  phone: string;
  onSuccess: () => void;
  onChangePhone: () => void;
};

type SendStatus =
  | { kind: "sending" }
  | { kind: "ready" }
  | { kind: "error"; error: NormalizedError };

export default function InlineOtpGate({ phone, onSuccess, onChangePhone }: InlineOtpGateProps) {
  const { t } = useTranslation();
  const { sendOtp } = useAuth();
  const [status, setStatus] = useState<SendStatus>({ kind: "sending" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await sendOtp(phone);
        if (!cancelled) setStatus({ kind: "ready" });
      } catch (err) {
        if (cancelled) return;
        setStatus({ kind: "error", error: normalizeError(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phone, sendOtp]);

  function retrySend() {
    setStatus({ kind: "sending" });
    void (async () => {
      try {
        await sendOtp(phone);
        setStatus({ kind: "ready" });
      } catch (err) {
        setStatus({ kind: "error", error: normalizeError(err) });
      }
    })();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("wizard.auth.title")}
      data-testid="inline-otp-gate"
      className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm px-4 py-8"
    >
      <div className="w-full max-w-[480px] bg-white rounded-[12px] p-6 shadow-xl">
        <h2 className="font-heading text-[24px] font-extrabold leading-tight text-cta-main mb-2">
          {t("wizard.auth.title")}
        </h2>
        <p className="font-body text-base leading-6 text-neutral-600 mb-6">
          {t("wizard.auth.subtitle", { phone: formatPhone(phone) })}
        </p>

        {status.kind === "sending" && (
          <p
            role="status"
            data-testid="inline-otp-sending"
            className="font-body text-sm text-neutral-500"
          >
            {t("wizard.auth.sending")}
          </p>
        )}

        {status.kind === "error" && (
          <div className="flex flex-col gap-3">
            <InlineError error={status.error} testId="inline-otp-send-error" />
            <Button
              variant="cta"
              size="md"
              type="button"
              onClick={retrySend}
              data-testid="inline-otp-retry-send"
              className="w-full"
            >
              {t("wizard.auth.retrySend")}
            </Button>
            <Button
              variant="ghost"
              size="md"
              type="button"
              onClick={onChangePhone}
              data-testid="otp-change-phone"
              className="w-full"
            >
              {t("auth.verify.change")}
            </Button>
          </div>
        )}

        {status.kind === "ready" && (
          <OtpCodeForm
            phone={phone}
            onSuccess={onSuccess}
            onChangePhone={onChangePhone}
          />
        )}
      </div>
    </div>
  );
}
