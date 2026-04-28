import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { Button, InlineError } from "../../ui";
import { useAuth } from "../../../contexts/AuthContext";
import { InvalidOtpError } from "../../../services/authService";
import { normalizeError, type NormalizedError } from "../../../services/errors";

export type OtpCodeFormProps = {
  phone: string;
  onSuccess: () => void;
  onChangePhone?: () => void;
};

type SubmitError =
  | { kind: "invalidOtp" }
  | { kind: "other"; error: NormalizedError };

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OtpCodeForm({ phone, onSuccess, onChangePhone }: OtpCodeFormProps) {
  const { t } = useTranslation();
  const { login, sendOtp } = useAuth();

  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [submitErrorState, setSubmitErrorState] = useState<SubmitError | null>(null);
  const [resendErrorState, setResendErrorState] = useState<NormalizedError | null>(null);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const submittingRef = useRef(false);

  const countdownActive = resendIn > 0;
  useEffect(() => {
    if (!countdownActive) return;
    const timer = window.setInterval(() => {
      setResendIn((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdownActive]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const submitCode = useCallback(
    async (fullCode: string) => {
      if (!phone || submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setSubmitErrorState(null);
      try {
        await login(phone, fullCode);
        onSuccess();
      } catch (err) {
        if (err instanceof InvalidOtpError) {
          setSubmitErrorState({ kind: "invalidOtp" });
        } else {
          setSubmitErrorState({ kind: "other", error: normalizeError(err) });
        }
        setDigits(Array(CODE_LENGTH).fill(""));
        submittingRef.current = false;
        setSubmitting(false);
        inputsRef.current[0]?.focus();
      }
    },
    [login, onSuccess, phone],
  );

  function onDigitChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 0) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      setSubmitErrorState(null);
      return;
    }
    if (cleaned.length === 1) {
      const newDigits = [...digits];
      newDigits[index] = cleaned;
      setDigits(() => newDigits);
      setSubmitErrorState(null);
      const nextInput = inputsRef.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      } else if (newDigits.every((d) => d !== "")) {
        void submitCode(newDigits.join(""));
      }
      return;
    }
    const trimmed = cleaned.slice(0, CODE_LENGTH - index);
    const newDigits = [...digits];
    for (let i = 0; i < trimmed.length; i += 1) {
      newDigits[index + i] = trimmed[i] ?? "";
    }
    setDigits(() => newDigits);
    setSubmitErrorState(null);
    const target = Math.min(index + trimmed.length, CODE_LENGTH - 1);
    inputsRef.current[target]?.focus();
    if (newDigits.every((d) => d !== "")) {
      void submitCode(newDigits.join(""));
    }
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      setDigits((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted.length === 0) return;
    event.preventDefault();
    const trimmed = pasted.slice(0, CODE_LENGTH);
    const newDigits = Array(CODE_LENGTH).fill("") as string[];
    for (let i = 0; i < trimmed.length; i += 1) {
      newDigits[i] = trimmed[i] ?? "";
    }
    setDigits(newDigits);
    setSubmitErrorState(null);
    const target = Math.min(trimmed.length, CODE_LENGTH - 1);
    inputsRef.current[target]?.focus();
    if (newDigits.every((d) => d !== "")) {
      void submitCode(newDigits.join(""));
    }
  }

  async function onResend() {
    if (resendIn > 0 || !phone) return;
    setResendErrorState(null);
    try {
      const { expiresIn } = await sendOtp(phone);
      setResendIn(expiresIn || RESEND_SECONDS);
    } catch (err) {
      setResendErrorState(normalizeError(err));
    }
  }

  return (
    <>
      <div
        className="flex items-center justify-between gap-2 mb-4"
        role="group"
        aria-label={t("auth.verify.title")}
        data-testid="otp-inputs"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            disabled={submitting}
            onChange={(e) => onDigitChange(index, e.target.value)}
            onKeyDown={(e) => onKeyDown(index, e)}
            onPaste={onPaste}
            aria-label={`${t("auth.verify.title")} ${index + 1}`}
            data-testid={`otp-input-${index}`}
            className={`h-14 w-11 lg:h-16 lg:w-12 rounded-[8px] border bg-white text-center font-heading text-2xl leading-none text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-500 disabled:opacity-60 ${
              submitErrorState ? "border-red-500" : "border-neutral-400 focus:border-blue-20"
            }`}
          />
        ))}
      </div>

      {submitErrorState?.kind === "invalidOtp" && (
        <p
          role="alert"
          data-testid="verify-error"
          data-error-kind="invalidOtp"
          className="font-body text-sm leading-4 text-red-600 mb-4"
        >
          {t("auth.verify.errors.invalidCode")}
        </p>
      )}
      {submitErrorState?.kind === "other" && (
        <div className="mb-4">
          <InlineError error={submitErrorState.error} testId="verify-error" />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="md"
          type="button"
          disabled={resendIn > 0 || submitting}
          onClick={onResend}
          className="w-full"
        >
          {resendIn > 0
            ? t("auth.verify.resendIn", { seconds: resendIn })
            : t("auth.verify.resend")}
        </Button>
        {resendErrorState && (
          <InlineError
            error={resendErrorState}
            overrideKey="errors.verifyResend"
            testId="resend-error"
          />
        )}
        {onChangePhone && (
          <Button
            variant="ghost"
            size="md"
            type="button"
            disabled={submitting}
            onClick={onChangePhone}
            data-testid="otp-change-phone"
            className="w-full"
          >
            {t("auth.verify.change")}
          </Button>
        )}
      </div>
    </>
  );
}
