import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "./Button";

type ContactFormProps = {
  onSuccess?: () => void;
  onClose?: () => void;
};

type FormData = {
  name: string;
  phone: string;
  service: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function ContactForm({ onSuccess, onClose }: ContactFormProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<FormData>({ name: "", phone: "", service: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!data.name.trim()) errs.name = t("contact.errors.nameRequired");
    else if (data.name.trim().length < 2) errs.name = t("contact.errors.nameMin");
    if (!data.phone.trim()) errs.phone = t("contact.errors.phoneRequired");
    else if (!/^\+77\d{9}$/.test(data.phone.replace(/[\s\-()]/g, "")))
      errs.phone = t("contact.errors.phoneInvalid");
    if (!data.service) errs.service = t("contact.errors.serviceRequired");
    return errs;
  };

  const handleBlur = (field: keyof FormData) => {
    const errs = validate();
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSubmitted(true);
      onSuccess?.();
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-semibold text-cta-main">{t("contact.success")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <h3 className="text-xl font-heading font-bold text-neutral-800">
        {t("contact.title")}
      </h3>

      <div>
        <input
          type="text"
          placeholder={t("contact.name")}
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          onBlur={() => handleBlur("name")}
          className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-base font-body outline-none focus:border-cta-main transition-colors"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <input
          type="tel"
          placeholder={t("contact.phone")}
          value={data.phone}
          onChange={(e) => setData({ ...data, phone: e.target.value })}
          onBlur={() => handleBlur("phone")}
          className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-base font-body outline-none focus:border-cta-main transition-colors"
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <select
          value={data.service}
          onChange={(e) => setData({ ...data, service: e.target.value })}
          onBlur={() => handleBlur("service")}
          className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-base font-body outline-none focus:border-cta-main transition-colors"
        >
          <option value="">{t("contact.servicePlaceholder")}</option>
          <option value="rental">{t("buttons.rental")}</option>
          <option value="sanitation">{t("buttons.sanitation")}</option>
          <option value="sale">{t("buttons.sale")}</option>
        </select>
        {errors.service && <p className="text-red-500 text-sm mt-1">{errors.service}</p>}
      </div>

      <Button type="submit" variant="cta" size="md" className="w-full mt-2">
        {t("contact.submit")}
      </Button>
    </form>
  );
}
