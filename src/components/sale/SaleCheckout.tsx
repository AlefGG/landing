import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import Seo from "../Seo";
import { StepHeader } from "../ui";
import ContactsSection, {
  type ContactsValue,
} from "../wizards/shared/ContactsSection";
import PriceSubmit from "../wizards/shared/PriceSubmit";
import Separator from "../wizards/shared/Separator";
import { createLead } from "../../services/leadsService";
import type { SaleItem } from "../../services/catalogService";

function Stepper({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center gap-2 w-[160px]">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="shrink-0 size-8 rounded-full bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to flex items-center justify-center text-white"
        aria-label="Уменьшить"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n) && n >= min) onChange(n);
        }}
        className="h-10 flex-1 min-w-0 rounded-[8px] border border-neutral-400 bg-white px-2 text-center font-body text-xl text-neutral-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="shrink-0 size-8 rounded-full bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to flex items-center justify-center text-white"
        aria-label="Увеличить"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export default function SaleCheckout({ item }: { item: SaleItem }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const name = t(item.nameKey);
  const description = t(item.descriptionKey);

  const [count, setCount] = useState(1);
  const [contacts, setContacts] = useState<ContactsValue>({
    contactType: "individual",
    name: "",
    phone: "",
    email: "",
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const total = item.price * count;

  const phoneDigits = useMemo(
    () => contacts.phone.replace(/\D/g, ""),
    [contacts.phone]
  );

  const canSubmit =
    item.inStock &&
    count >= 1 &&
    contacts.name.trim().length > 0 &&
    phoneDigits.length === 11;

  const disabledReason = !canSubmit
    ? !item.inStock
      ? t("catalog.sale.checkout.errors.outOfStock")
      : submitAttempted
        ? t("catalog.sale.checkout.errors.fillAll")
        : undefined
    : undefined;

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const normalized = phoneDigits.startsWith("8")
        ? "7" + phoneDigits.slice(1)
        : phoneDigits;
      const { redirectTo } = await createLead({
        name: contacts.name.trim(),
        phone: normalized,
        service: "sale",
        locale: i18n.language,
        source: "sale-checkout",
        email: contacts.email.trim() || undefined,
        itemId: item.id,
        count,
        contactType: contacts.contactType,
        amount: total,
      });
      navigate(redirectTo);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const title = t("catalog.sale.checkout.title");

  return (
    <div className="bg-white overflow-x-clip">
      <Seo
        pageKey="sale"
        titleOverride={`${name} — ${title} — ${t("meta.brandName")}`}
        descriptionOverride={description}
      />

      {/* Hero with 4-level breadcrumb */}
      <section className="relative h-[104px] lg:h-[176px]">
        <div
          className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-[1216px] h-[712px] pointer-events-none"
          style={{ top: "-64px" }}
          aria-hidden="true"
        >
          <img src="/assets/images/wizard-hero-shape.svg" alt="" className="w-full h-full" />
        </div>
        <div
          className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#f1f1f1] to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-[1216px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-0.5 text-xs font-body mb-2 lg:mb-8">
            <Link to="/" className="text-[#2d84c1] underline leading-4 text-xs px-[10px] py-[8px]">
              {t("wizard.rental.breadcrumbHome")}
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-neutral-500" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Link to="/sale" className="text-[#2d84c1] underline leading-4 text-xs px-[10px] py-[8px]">
              {t("catalog.sale.backToCatalog")}
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-neutral-500" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Link to={`/sale/${item.id}`} className="text-[#2d84c1] underline leading-4 text-xs px-[10px] py-[8px]">
              {name}
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-neutral-500" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-neutral-500 leading-4 text-xs px-[10px] py-[8px]">
              {t("catalog.sale.checkout.breadcrumb")}
            </span>
          </nav>

          <h1 className="font-heading text-[32px] lg:text-[56px] font-extrabold leading-[32px] lg:leading-[56px] text-cta-main">
            {title}
          </h1>
        </div>

        <p
          className="hidden lg:block absolute right-[230px] top-[100px] font-heading text-[144px] font-extrabold leading-[56px] pointer-events-none select-none"
          style={{
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(89, 176, 2, 0.15)",
          }}
          aria-hidden="true"
        >
          {title}
        </p>
      </section>

      {/* Summary */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
          <div className="size-[120px] shrink-0 flex items-center justify-center bg-white rounded-2xl">
            <img
              src={item.image}
              alt={name}
              className="h-[120px] w-[120px] object-contain"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <h2 className="font-heading text-xl lg:text-2xl font-extrabold leading-7 text-neutral-900">
              {name}
            </h2>
            <p className="font-body text-base leading-6 text-neutral-600">
              {description}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-body text-sm leading-4 text-neutral-600">
              {t("catalog.sale.checkout.summaryCount")}
            </span>
            <Stepper value={count} onChange={setCount} min={1} />
          </div>
          <div className="flex flex-col gap-2 lg:items-end">
            <span className="font-body text-sm leading-4 text-neutral-600">
              {t("catalog.sale.checkout.summaryTotal")}
            </span>
            <span className="font-body font-semibold text-2xl leading-8 text-cta-main whitespace-nowrap">
              {total.toLocaleString("ru-RU")} {t("wizard.rental.currency")}
            </span>
          </div>
        </div>
      </section>

      <Separator />

      {/* Contacts */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <StepHeader step={1} title={t("catalog.sale.checkout.contactsStep")} />
        <ContactsSection value={contacts} onChange={setContacts} />
      </section>

      <Separator />

      <PriceSubmit
        price={total}
        disabled={!canSubmit || submitting}
        disabledReason={
          submitting
            ? t("catalog.sale.checkout.submitting")
            : disabledReason
        }
        onSubmit={handleSubmit}
      />
    </div>
  );
}
