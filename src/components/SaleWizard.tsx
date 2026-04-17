import { useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { StepHeader, BasicInput } from "./ui";
import Faq from "./Faq";

type CabinType = "standard" | "lux" | "vip";
type ContactType = "individual" | "legal";
type PaymentType = "paypal" | "card" | "webmoney";

const cabins: { type: CabinType; image: string }[] = [
  { type: "standard", image: "/assets/images/cabin-standard.png" },
  { type: "lux", image: "/assets/images/cabin-lux.png" },
  { type: "vip", image: "/assets/images/cabin-vip.png" },
];

function Stepper({
  value,
  onChange,
  min = 0,
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

function RadioOption({
  selected,
  onClick,
  label,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-[6px] ${className}`}
    >
      <span
        className={`size-5 shrink-0 rounded-full ${selected ? "bg-cta-main flex items-center justify-center" : "border border-neutral-500"}`}
      >
        {selected && <span className="size-2 rounded-full bg-white" />}
      </span>
      <span
        className={`font-body text-base lg:text-xl leading-6 ${selected ? "text-neutral-900" : "text-neutral-600"}`}
      >
        {label}
      </span>
    </button>
  );
}

function Separator() {
  return (
    <div className="w-full px-4 lg:px-0">
      <div className="w-full max-w-[1008px] mx-auto h-px bg-neutral-200" />
    </div>
  );
}

export default function SaleWizard() {
  const { t } = useTranslation();
  const k = "wizard.sale" as const;

  const [selectedCabin, setSelectedCabin] = useState<CabinType>("standard");
  const [cabinCount, setCabinCount] = useState(0);
  const [contactType, setContactType] = useState<ContactType>("individual");
  const [payment, setPayment] = useState<PaymentType>("paypal");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const formatPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, "");
    const d = digits.startsWith("8") ? "7" + digits.slice(1) : digits;
    if (d.length === 0) return "";
    if (d.length <= 1) return `+${d}`;
    if (d.length <= 4) return `+${d.slice(0, 1)} ${d.slice(1)}`;
    if (d.length <= 7) return `+${d.slice(0, 1)} ${d.slice(1, 4)} ${d.slice(4)}`;
    if (d.length <= 9) return `+${d.slice(0, 1)} ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7)}`;
    return `+${d.slice(0, 1)} ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const cabinLabels: Record<CabinType, string> = {
    standard: t("wizard.cabins.standard"),
    lux: t("wizard.cabins.lux"),
    vip: t("wizard.cabins.vip"),
  };

  const paymentLabels: Record<PaymentType, string> = {
    paypal: "Paypal",
    card: "Credit/Debit card",
    webmoney: "WebMoney",
  };

  const heroTitle = t(`${k}.title`);

  return (
    <div className="bg-white overflow-x-clip">
      {/* Hero */}
      <section className="relative h-[104px] lg:h-[176px]">
        <div
          className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-[1216px] h-[712px] pointer-events-none"
          style={{ top: "-64px" }}
          aria-hidden="true"
        >
          <img src="/assets/images/wizard-hero-shape.svg" alt="" className="w-full h-full" />
        </div>
        <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#f1f1f1] to-transparent pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-[1216px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-0.5 text-xs font-body mb-2 lg:mb-8">
            <Link to="/" className="text-[#2d84c1] underline leading-4 text-xs px-[10px] py-[8px]">
              Home
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-neutral-500" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-neutral-500 leading-4 text-xs px-[10px] py-[8px]">{heroTitle}</span>
          </nav>

          <h1 className="font-heading text-[32px] lg:text-[56px] font-extrabold leading-[32px] lg:leading-[56px] text-cta-main">
            {heroTitle}
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
          {heroTitle}
        </p>
      </section>

      {/* Step 1: Cabin selection */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px] px-[12px] lg:px-0">
          <StepHeader step={1} title={t(`${k}.step1Title`)} />
          <div className="mt-4 py-4 flex flex-col lg:flex-row items-stretch lg:items-start justify-between gap-2 lg:gap-4">
            {cabins.map(({ type, image }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedCabin(type)}
                className="flex items-center lg:flex-col gap-6 w-full lg:w-[288px] px-0 lg:px-10 py-0 lg:py-4 rounded-3xl bg-white transition-shadow hover:shadow-md"
              >
                <img
                  src={image}
                  alt={cabinLabels[type]}
                  className="h-[98px] lg:h-[200px] w-auto object-contain shrink-0"
                />
                <div className="flex items-center gap-2">
                  <span
                    className={`size-5 shrink-0 rounded-full ${selectedCabin === type ? "bg-cta-main flex items-center justify-center" : "border border-neutral-500"}`}
                  >
                    {selectedCabin === type && <span className="size-2 rounded-full bg-white" />}
                  </span>
                  <span className="font-body text-base lg:text-xl leading-6 text-neutral-900">
                    {cabinLabels[type]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 2: Cabin count */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px] px-[12px] lg:px-0">
          <StepHeader step={2} title={t(`${k}.step2Title`)} />
          <div className="mt-4 py-4 flex flex-col gap-2">
            <p className="font-body text-base lg:text-xl leading-6 text-neutral-900 lg:text-neutral-600">
              {t(`${k}.step2Question`)}
            </p>
            <Stepper value={cabinCount} onChange={setCabinCount} />
            <p className="font-body text-sm lg:text-base leading-4 lg:leading-6 text-neutral-500">
              {t(`${k}.step2Hint`)}
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 3: Contacts */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px] px-[12px] lg:px-0">
          <StepHeader step={3} title={t(`${k}.step3Title`)} />
          <div className="mt-8 lg:mt-4 lg:py-6 flex flex-col gap-8">
            <div className="flex flex-row gap-2 lg:gap-[72px]">
              <RadioOption
                selected={contactType === "individual"}
                onClick={() => setContactType("individual")}
                label={t(`${k}.step3Individual`)}
                className="flex-1 lg:flex-initial"
              />
              <RadioOption
                selected={contactType === "legal"}
                onClick={() => setContactType("legal")}
                label={t(`${k}.step3Legal`)}
                className="flex-1 lg:flex-initial"
              />
            </div>

            <div className="flex flex-wrap gap-y-4 gap-x-[32px] lg:gap-[72px]">
              {(Object.keys(paymentLabels) as PaymentType[]).map((key) => (
                <RadioOption
                  key={key}
                  selected={payment === key}
                  onClick={() => setPayment(key)}
                  label={paymentLabels[key]}
                />
              ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
              <div className="flex flex-col gap-2 w-full lg:w-[280px]">
                <label className="font-body text-base lg:text-xl leading-6 text-neutral-600">
                  {t(`${k}.step3Name`)}
                </label>
                <BasicInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Placeholder"
                  className="!h-10"
                />
              </div>
              <div className="flex flex-col gap-2 w-full lg:w-[280px]">
                <label className="font-body text-base lg:text-xl leading-6 text-neutral-600">
                  {t(`${k}.step3Phone`)}
                </label>
                <BasicInput
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 XXX XXX-XX-XX"
                  className="!h-10"
                />
              </div>
              <div className="flex flex-col gap-2 w-full lg:w-[280px]">
                <label className="font-body text-base lg:text-xl leading-6 text-neutral-600">
                  {t(`${k}.step3Email`)}
                </label>
                <BasicInput
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Placeholder"
                  className="!h-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Price + Submit */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 pt-8 lg:pt-12 pb-16 lg:pb-[104px]">
        <div className="lg:px-[104px] px-[12px] lg:px-0 flex flex-col lg:flex-row items-stretch lg:items-center gap-6">
          <div className="flex items-center gap-2 whitespace-nowrap justify-end lg:justify-start">
            <span className="font-body text-xl text-neutral-900">
              {t(`${k}.price`)}
            </span>
            <span className="font-body font-semibold text-2xl leading-8 text-cta-main">
              125 000
            </span>
            <span className="font-body text-xl text-neutral-900">₸</span>
          </div>
          <button
            type="button"
            className="flex items-center justify-between gap-4 bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white font-body font-semibold text-base rounded-[40px] pl-10 pr-8 py-3 w-full lg:w-[272px]"
          >
            <span>{t(`${k}.submit`)}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9.51 4.23l8.56 4.28c3.84 1.92 3.84 5.06 0 6.98l-8.56 4.28c-5.76 2.88-8.11.52-5.23-5.23l.87-1.73a1.88 1.88 0 000-1.63l-.87-1.74C1.4 3.71 3.76 1.35 9.51 4.23z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.44 12h5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </section>

      <Faq />
    </div>
  );
}
