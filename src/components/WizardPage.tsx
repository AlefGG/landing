import { useState, useRef, useEffect, type ChangeEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { StepHeader, BasicInput, Calendar, TimeDropdown } from "./ui";
import Faq from "./Faq";

type CabinType = "standard" | "lux" | "vip";
type FrequencyType = "once" | "scheduled";
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

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer ${checked ? "bg-cta-main" : "bg-[#c5d3dd]"}`}
      >
        <span
          className={`absolute left-0 top-[2px] size-6 rounded-full bg-white shadow-md transition-transform ${checked ? "translate-x-[22px]" : "translate-x-[2px]"}`}
        />
      </button>
      <span className={`font-body text-xl leading-6 ${checked ? "text-neutral-900" : "text-neutral-600"}`}>
        {label}
      </span>
    </div>
  );
}

function RadioOption({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-[6px]"
    >
      <span
        className={`size-5 shrink-0 rounded-full ${selected ? "bg-cta-main flex items-center justify-center" : "border border-neutral-500"}`}
      >
        {selected && <span className="size-2 rounded-full bg-white" />}
      </span>
      <span
        className={`font-body text-xl leading-6 ${selected ? "text-neutral-900" : "text-neutral-600"}`}
      >
        {label}
      </span>
    </button>
  );
}

function Separator() {
  return <div className="w-full max-w-[1008px] mx-auto h-px bg-neutral-200" />;
}

export type WizardConfig = {
  pageKey: "sanitation" | "rental" | "sale";
  breadcrumbLabel: string;
  heroTitle: string;
  warning?: ReactNode;
};

export default function WizardPage({ pageKey, breadcrumbLabel, heroTitle, warning }: WizardConfig) {
  const { t } = useTranslation();

  const k = `wizard.${pageKey}` as const;

  const [cabinCount, setCabinCount] = useState(0);
  const [address, setAddress] = useState("");
  const [selectedCabin, setSelectedCabin] = useState<CabinType>("standard");
  const [serviceEnabled, setServiceEnabled] = useState(true);
  const [cleaningEnabled, setCleaningEnabled] = useState(true);
  const [installNotice, setInstallNotice] = useState(false);
  const [machineCount, setMachineCount] = useState(0);
  const [crewCount, setCrewCount] = useState(0);
  const [frequency, setFrequency] = useState<FrequencyType>("once");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [payment, setPayment] = useState<PaymentType>("paypal");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const timeOptions = Array.from({ length: 24 }, (_, h) => [
    { time: `${String(h).padStart(2, "0")}:00` },
    { time: `${String(h).padStart(2, "0")}:30` },
  ]).flat();

  useEffect(() => {
    if (!calendarOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [calendarOpen]);

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

  const formatDate = (d: Date): string => {
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
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

  return (
    <div className="bg-white overflow-x-clip">
      {/* Hero banner */}
      <section className="relative h-[160px] lg:h-[176px]">
        {/*
          Gray gradient tab shape.
          Figma: shape is 1216×712, starts at top of the full hero frame which includes the navbar.
          We shift it up by 64px (navbar height) so it extends behind the sticky navbar.
          The SVG shape has a tab-cutout: at y<64 only the RIGHT part (x>690) has fill,
          so left nav links remain unaffected. The navbar is transparent on wizard pages.
        */}
        <div
          className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-[1216px] h-[712px] pointer-events-none"
          style={{ top: "-64px" }}
          aria-hidden="true"
        >
          <img
            src="/assets/images/wizard-hero-shape.svg"
            alt=""
            className="w-full h-full"
          />
        </div>
        {/* Mobile: simple gradient bg */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#f1f1f1] to-transparent pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-[1216px] mx-auto px-4 lg:px-8 pt-6 lg:pt-[24px]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-0.5 text-xs font-body mb-4 lg:mb-8">
            <Link to="/" className="text-[#2d84c1] underline leading-4 text-xs">
              Home
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-neutral-500" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-neutral-500 leading-4 text-xs">{breadcrumbLabel}</span>
          </nav>

          <h1 className="font-heading text-[32px] lg:text-[56px] font-extrabold leading-[56px] text-cta-main">
            {heroTitle}
          </h1>
        </div>

        {/* Decorative large outlined text */}
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

      {/* Warning toast (optional) */}
      {warning && (
        <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-4">
          <div className="flex gap-2 items-start bg-[#fff7de] border border-[#f2bc70] rounded-[8px] py-4 pl-6 pr-4 shadow-[0px_6px_8px_0px_rgba(0,0,0,0.08)]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#e7a74c] mt-0.5">
              <path d="M12 9v4M12 16h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="font-body text-base leading-6 text-neutral-900">
              {warning}
            </p>
          </div>
        </section>
      )}

      {/* Step 1: Cabin count */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepHeader step={1} title={t(`${k}.step1Title`)} />
          <div className="mt-4 py-4">
            <p className="font-body text-xl text-neutral-600 mb-2">
              {t(`${k}.step1Question`)}
            </p>
            <Stepper value={cabinCount} onChange={setCabinCount} />
            <p className="font-body text-base text-neutral-500 mt-2">
              {t(`${k}.step1Hint`)}
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 2: Address */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepHeader step={2} title={t(`${k}.step2Title`)} />
          <div className="mt-4 py-6">
            <BasicInput
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t(`${k}.step2Placeholder`)}
              className="max-w-[488px]"
            />
            <div className="mt-2 w-full h-[400px] lg:h-[550px] rounded-2xl border border-neutral-300 bg-neutral-200 flex items-center justify-center text-neutral-500">
              <span className="font-body text-base">{t(`${k}.mapPlaceholder`)}</span>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 3: Cabin selection */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepHeader step={3} title={t(`${k}.step3Title`)} />
          <div className="mt-4 py-4 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 lg:gap-4">
            {cabins.map(({ type, image }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedCabin(type)}
                className="flex flex-col items-center gap-6 w-full lg:w-[288px] px-10 py-4 rounded-3xl bg-white transition-shadow hover:shadow-md"
              >
                <img
                  src={image}
                  alt={cabinLabels[type]}
                  className="h-[200px] w-auto object-contain"
                />
                <RadioOption
                  selected={selectedCabin === type}
                  onClick={() => setSelectedCabin(type)}
                  label={cabinLabels[type]}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 4: Service frequency */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepHeader step={4} title={t(`${k}.step4Title`)} />

          <div className="mt-4 py-6 flex flex-col lg:flex-row gap-6 lg:gap-[72px]">
            <Toggle
              checked={serviceEnabled}
              onChange={setServiceEnabled}
              label={t(`${k}.step4Service`)}
            />
            <Toggle
              checked={cleaningEnabled}
              onChange={setCleaningEnabled}
              label={t(`${k}.step4Cleaning`)}
            />
            <Toggle
              checked={installNotice}
              onChange={setInstallNotice}
              label={t(`${k}.step4InstallNotice`)}
            />
          </div>

          <h3 className="font-heading text-[32px] font-extrabold leading-[32px] text-neutral-900 mt-2">
            {t(`${k}.step4Resources`)}
          </h3>
          <div className="mt-4 py-4">
            <p className="font-body text-xl text-neutral-600 mb-2">
              {t(`${k}.step4Required`)}
            </p>
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-14">
              <div className="flex items-center gap-2">
                <Stepper value={machineCount} onChange={setMachineCount} />
                <span className="font-body text-xl text-neutral-600">
                  {t(`${k}.step4Machine`)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Stepper value={crewCount} onChange={setCrewCount} />
                <span className="font-body text-xl text-neutral-600">
                  {t(`${k}.step4Crew`)}
                </span>
              </div>
            </div>
            <p className="font-body text-base text-neutral-500 mt-2">
              {t(`${k}.step1Hint`)}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 mt-4">
            <div className="flex flex-col gap-2 w-full lg:w-[384px] py-4">
              <RadioOption
                selected={frequency === "once"}
                onClick={() => setFrequency("once")}
                label={t(`${k}.step4Once`)}
              />
              <p className="font-body text-base text-neutral-500">
                {t(`${k}.step4OnceDesc`)}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full lg:w-[384px] py-4">
              <RadioOption
                selected={frequency === "scheduled"}
                onClick={() => setFrequency("scheduled")}
                label={t(`${k}.step4Scheduled`)}
              />
              <p className="font-body text-base text-neutral-500">
                {t(`${k}.step4ScheduledDesc`)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 5: Rental period */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepHeader step={5} title={t(`${k}.step5Title`)} />
          <div className="mt-4 py-6 flex flex-col lg:flex-row items-start gap-4 lg:gap-8">
            <div className="relative" ref={calendarRef}>
              <button
                type="button"
                onClick={() => setCalendarOpen((v) => !v)}
                className={`flex h-[44px] w-[280px] items-center rounded-[8px] border border-neutral-400 bg-white px-[11px] text-left font-body text-base leading-6 ${startDate ? "text-neutral-900" : "text-neutral-300"}`}
              >
                {startDate ? formatDate(startDate) : t(`${k}.step5StartDate`)}
              </button>
              {calendarOpen && (
                <div className="absolute top-full left-0 z-50 mt-1">
                  <Calendar
                    mode="single"
                    value={startDate}
                    onChange={(d) => {
                      setStartDate(d as Date);
                      setCalendarOpen(false);
                    }}
                  />
                </div>
              )}
            </div>

            <TimeDropdown
              options={timeOptions}
              value={startTime}
              onChange={setStartTime}
              isOpen={startTimeOpen}
              onToggle={() => setStartTimeOpen((v) => !v)}
              placeholder={t(`${k}.step5StartTime`)}
              className="w-[160px]"
            />

            <TimeDropdown
              options={timeOptions}
              value={endTime}
              onChange={setEndTime}
              isOpen={endTimeOpen}
              onToggle={() => setEndTimeOpen((v) => !v)}
              placeholder={t(`${k}.step5EndTime`)}
              className="w-[160px]"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 6: Contacts */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepHeader step={6} title={t(`${k}.step6Title`)} />
          <div className="mt-4 py-6">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-[72px] mb-8">
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
                <label className="font-body text-xl text-neutral-600">
                  {t(`${k}.step6Name`)}
                </label>
                <BasicInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Placeholder"
                  className="!h-10"
                />
              </div>
              <div className="flex flex-col gap-2 w-full lg:w-[280px]">
                <label className="font-body text-xl text-neutral-600">
                  {t(`${k}.step6Phone`)}
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
                <label className="font-body text-xl text-neutral-600">
                  {t(`${k}.step6Email`)}
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
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 pt-12 pb-[104px]">
        <div className="lg:px-[104px] flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex items-center gap-2 whitespace-nowrap">
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
            className="flex items-center justify-between gap-4 bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white font-body font-semibold text-base rounded-[40px] px-10 py-3 w-full lg:w-[272px]"
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
