import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button, InlineError } from "../components/ui";
import Seo from "../components/Seo";
import { formatPhone } from "../components/wizards/shared/phoneFormat";
import { useAuth } from "../contexts/AuthContext";
import { InvalidOtpError } from "../services/authService";
import {
  normalizeError,
  type NormalizedError,
} from "../services/errors";

type VerifyError =
  | { kind: "invalidOtp" }
  | { kind: "other"; error: NormalizedError };

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyPage() {
  const { t } = useTranslation();
  const { login, sendOtp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const phone = params.get("phone") ?? "";
  const redirect = params.get("redirect");

  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [submitErrorState, setSubmitErrorState] = useState<VerifyError | null>(null);
  const [resendErrorState, setResendErrorState] = useState<NormalizedError | null>(null);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => digits.join(""), [digits]);
  const codeComplete = code.length === CODE_LENGTH && digits.every((d) => d !== "");

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => {
      setResendIn((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const submitCode = useCallback(
    async (fullCode: string) => {
      if (!phone || submitting) return;
      setSubmitting(true);
      setSubmitErrorState(null);
      try {
        await login(phone, fullCode);
        navigate(redirect || "/", { replace: true });
      } catch (err) {
        if (err instanceof InvalidOtpError) {
          setSubmitErrorState({ kind: "invalidOtp" });
        } else {
          setSubmitErrorState({ kind: "other", error: normalizeError(err) });
        }
        setDigits(Array(CODE_LENGTH).fill(""));
        setSubmitting(false);
        inputsRef.current[0]?.focus();
      }
    },
    [login, navigate, phone, redirect, submitting],
  );

  useEffect(() => {
    if (codeComplete && !submitting) {
      void submitCode(code);
    }
  }, [code, codeComplete, submitCode, submitting]);

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
      setDigits((prev) => {
        const next = [...prev];
        next[index] = cleaned;
        return next;
      });
      setSubmitErrorState(null);
      const nextInput = inputsRef.current[index + 1];
      if (nextInput) nextInput.focus();
      return;
    }
    // Multiple digits pasted into one input — distribute.
    const trimmed = cleaned.slice(0, CODE_LENGTH - index);
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < trimmed.length; i += 1) {
        next[index + i] = trimmed[i];
      }
      return next;
    });
    setSubmitErrorState(null);
    const target = Math.min(index + trimmed.length, CODE_LENGTH - 1);
    inputsRef.current[target]?.focus();
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
    setDigits(() => {
      const next = Array(CODE_LENGTH).fill("");
      for (let i = 0; i < trimmed.length; i += 1) {
        next[i] = trimmed[i];
      }
      return next;
    });
    setSubmitErrorState(null);
    const target = Math.min(trimmed.length, CODE_LENGTH - 1);
    inputsRef.current[target]?.focus();
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

  if (!phone) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="bg-white min-h-[60vh]">
      <Seo pageKey="auth" />
      <div className="max-w-[480px] mx-auto px-4 lg:px-8 pt-8 lg:pt-16 pb-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-0.5 text-xs font-body mb-6">
          <Link to="/login" className="text-[#1F5F8F] underline leading-4 text-xs px-[10px] py-[8px]">
            {t("auth.login.title")}
          </Link>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0 text-neutral-500"
            aria-hidden="true"
          >
            <path
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-neutral-500 leading-4 text-xs px-[10px] py-[8px]">
            {t("auth.verify.title")}
          </span>
        </nav>

        <h1 className="font-heading text-[28px] lg:text-[40px] font-extrabold leading-tight text-cta-main mb-3">
          {t("auth.verify.title")}
        </h1>
        <p className="font-body text-base leading-6 text-neutral-600 mb-1">
          {t("auth.verify.subtitle", { phone: formatPhone(phone) })}
        </p>
        <Link
          to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
          className="inline-block mb-8 font-body text-sm leading-4 text-[#1F5F8F] underline"
        >
          {t("auth.verify.change")}
        </Link>

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
            <InlineError
              error={submitErrorState.error}
              testId="verify-error"
            />
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
        </div>
      </div>
    </div>
  );
}
