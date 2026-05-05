import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { BasicInput, Button } from "../components/ui";
import Seo from "../components/Seo";
import { formatPhone } from "../components/wizards/shared/phoneFormat";
import { useAuth } from "../contexts/AuthContext";
import { OtpSendError } from "../services/authService";

function toDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("8") ? "7" + digits.slice(1) : digits;
}

function isValidPhone(digits: string): boolean {
  return digits.length === 11 && digits.startsWith("7");
}

export default function LoginPage() {
  const { t } = useTranslation();
  const { sendOtp, status } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect");

  const [phoneInput, setPhoneInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = toDigits(phoneInput);
  const phoneValid = isValidPhone(digits);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phoneValid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await sendOtp(digits);
      const query = new URLSearchParams({ phone: digits });
      if (redirect) query.set("redirect", redirect);
      navigate(`/verify?${query.toString()}`);
    } catch (err) {
      setError(
        err instanceof OtpSendError
          ? t("auth.login.errors.sendFailed")
          : t("auth.login.errors.sendFailed"),
      );
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      navigate(redirect || "/", { replace: true });
    }
  }, [status, redirect, navigate]);

  return (
    <div className="bg-white min-h-[60vh]">
      <Seo pageKey="auth" />
      <div className="max-w-[480px] mx-auto px-4 lg:px-8 pt-8 lg:pt-16 pb-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-0.5 text-xs font-body mb-6">
          <Link to="/" className="text-[#1F5F8F] underline leading-4 text-xs px-[10px] py-[8px]">
            {t("success.breadcrumbHome")}
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
            {t("auth.login.title")}
          </span>
        </nav>

        <h1 className="font-heading text-[28px] lg:text-[40px] font-extrabold leading-tight text-cta-main mb-3">
          {t("auth.login.title")}
        </h1>
        <p className="font-body text-base leading-6 text-neutral-600 mb-8">
          {t("auth.login.subtitle")}
        </p>

        <form onSubmit={onSubmit} noValidate>
          <label className="block font-body text-sm leading-4 text-neutral-700 mb-2" htmlFor="auth-phone">
            {t("auth.login.phoneLabel")}
          </label>
          <BasicInput
            id="auth-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t("auth.login.phonePlaceholder")}
            value={formatPhone(phoneInput)}
            onChange={(e) => setPhoneInput(toDigits(e.target.value).slice(0, 11))}
            aria-invalid={error !== null || undefined}
            aria-describedby={error ? "auth-phone-error" : undefined}
          />
          {error && (
            <p
              id="auth-phone-error"
              className="mt-2 font-body text-sm leading-4 text-red-600"
              data-testid="login-error"
            >
              {error}
            </p>
          )}

          <div className="mt-6">
            <Button
              variant="cta"
              size="md"
              type="submit"
              disabled={!phoneValid || submitting}
              className="w-full"
            >
              {submitting ? t("auth.login.sending") : t("auth.login.submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
