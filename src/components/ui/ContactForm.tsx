import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import { createLead, LeadSubmissionError, type LeadPayload } from "../../services/leadsService";

type ContactFormProps = {
  onSuccess?: () => void;
  titleId?: string;
};

type FormData = {
  name: string;
  phone: string;
  service: "" | LeadPayload["service"];
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

export default function ContactForm({ onSuccess, titleId }: ContactFormProps) {
  const { t, i18n } = useTranslation();
  const nameId = useId();
  const phoneId = useId();
  const serviceId = useId();
  const nameErrorId = `${nameId}-error`;
  const phoneErrorId = `${phoneId}-error`;
  const serviceErrorId = `${serviceId}-error`;

  const [data, setData] = useState<FormData>({ name: "", phone: "", service: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    const name = data.name.trim();
    const phone = data.phone.replace(/[\s\-()]/g, "");

    if (!name) errs.name = t("contact.errors.nameRequired");
    else if (name.length < 2) errs.name = t("contact.errors.nameMin");

    if (!phone) errs.phone = t("contact.errors.phoneRequired");
    else if (!PHONE_REGEX.test(phone)) errs.phone = t("contact.errors.phoneInvalid");

    if (!data.service) errs.service = t("contact.errors.serviceRequired");

    return errs;
  };

  const handleBlur = (field: keyof FormData) => {
    const errs = validate();
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("submitting");
    setSubmitError(null);

    try {
      await createLead({
        name: data.name.trim(),
        phone: data.phone.replace(/[\s\-()]/g, ""),
        service: data.service as LeadPayload["service"],
        locale: i18n.language,
        source: "landing-cta-modal",
      });
      setStatus("success");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setSubmitError(
        err instanceof LeadSubmissionError ? err.message : t("contact.errors.submitFailed"),
      );
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-semibold text-cta-main">{t("contact.success")}</p>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate aria-busy={submitting}>
      <h3 id={titleId} className="text-xl font-heading font-bold text-neutral-800">
        {t("contact.title")}
      </h3>

      <div>
        <label htmlFor={nameId} className="sr-only">
          {t("contact.name")}
        </label>
        <input
          id={nameId}
          type="text"
          placeholder={t("contact.name")}
          value={data.name}
          onChange={(e) => updateField("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          disabled={submitting}
          aria-invalid={errors.name ? "true" : "false"}
          aria-describedby={errors.name ? nameErrorId : undefined}
          className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-base font-body outline-none focus:border-cta-main transition-colors disabled:opacity-60"
        />
        {errors.name && (
          <p id={nameErrorId} className="text-red-500 text-sm mt-1">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={phoneId} className="sr-only">
          {t("contact.phone")}
        </label>
        <input
          id={phoneId}
          type="tel"
          placeholder={t("contact.phone")}
          value={data.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          onBlur={() => handleBlur("phone")}
          disabled={submitting}
          aria-invalid={errors.phone ? "true" : "false"}
          aria-describedby={errors.phone ? phoneErrorId : undefined}
          className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-base font-body outline-none focus:border-cta-main transition-colors disabled:opacity-60"
        />
        {errors.phone && (
          <p id={phoneErrorId} className="text-red-500 text-sm mt-1">
            {errors.phone}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={serviceId} className="sr-only">
          {t("contact.servicePlaceholder")}
        </label>
        <select
          id={serviceId}
          value={data.service}
          onChange={(e) => updateField("service", e.target.value as FormData["service"])}
          onBlur={() => handleBlur("service")}
          disabled={submitting}
          aria-invalid={errors.service ? "true" : "false"}
          aria-describedby={errors.service ? serviceErrorId : undefined}
          className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-base font-body outline-none focus:border-cta-main transition-colors disabled:opacity-60"
        >
          <option value="">{t("contact.servicePlaceholder")}</option>
          <option value="rental">{t("buttons.rental")}</option>
          <option value="sanitation">{t("buttons.sanitation")}</option>
          <option value="sale">{t("buttons.sale")}</option>
        </select>
        {errors.service && (
          <p id={serviceErrorId} className="text-red-500 text-sm mt-1">
            {errors.service}
          </p>
        )}
      </div>

      {submitError && (
        <p role="alert" className="text-red-500 text-sm">
          {submitError}
        </p>
      )}

      <Button type="submit" variant="cta" size="md" className="w-full mt-2" disabled={submitting}>
        {submitting ? t("contact.submitting") : t("contact.submit")}
      </Button>
    </form>
  );
}
