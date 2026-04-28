import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";
import { formatPhone } from "../components/wizards/shared/phoneFormat";
import OtpCodeForm from "../components/wizards/shared/OtpCodeForm";

export default function VerifyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const phone = params.get("phone") ?? "";
  const redirect = params.get("redirect");

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

        <OtpCodeForm
          phone={phone}
          onSuccess={() => navigate(redirect || "/", { replace: true })}
        />
      </div>
    </div>
  );
}
