import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BasicInput, Calendar, TimeDropdown, MapPicker, AddressList } from "./ui";
import { useAddressTrip } from "../hooks/useAddressTrip";
import RentalFaq from "./RentalFaq";

type ObjectType = "event" | "construction" | "emergency";
type CabinType = "standard" | "lux" | "vip";
type ContactType = "individual" | "legal";

const cabins: { type: CabinType; image: string }[] = [
  { type: "standard", image: "/assets/images/cabin-standard.png" },
  { type: "lux", image: "/assets/images/cabin-lux.png" },
  { type: "vip", image: "/assets/images/cabin-vip.png" },
];

function StepLabel({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span
        style={{ fontFamily: "'Geologica', sans-serif" }}
        className="font-normal text-xs lg:text-[18px] leading-4 lg:leading-6 tracking-[2.4px] lg:tracking-[3.6px] uppercase text-cta-main"
      >
        ШАГ {step}
      </span>
      <h2 className="font-heading text-2xl lg:text-[32px] font-extrabold leading-6 lg:leading-8 text-neutral-900">
        {title}
      </h2>
    </div>
  );
}

function RadioRow({
  selected,
  onClick,
  label,
  description,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 text-left ${className}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`size-5 shrink-0 rounded-full overflow-hidden ${
            selected ? "bg-cta-main flex items-center justify-center" : "border border-neutral-500"
          }`}
        >
          {selected && <span className="size-[6px] rounded-full bg-white" />}
        </span>
        <span
          className={`font-body text-xl leading-6 ${
            selected ? "text-neutral-900" : "text-neutral-900"
          }`}
        >
          {label}
        </span>
      </div>
      {description && (
        <p className="font-body text-base leading-6 text-neutral-500">{description}</p>
      )}
    </button>
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
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer ${
          checked ? "bg-cta-main" : "bg-[#c5d3dd]"
        }`}
      >
        <span
          className={`absolute left-0 top-[2px] size-6 rounded-full bg-white shadow-md transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-[2px]"
          }`}
        />
      </button>
      <span
        className={`font-body text-xl leading-6 ${
          checked ? "text-neutral-900" : "text-neutral-600"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function SectionSeparator() {
  return (
    <div className="w-full px-4 lg:px-0">
      <div className="w-full max-w-[1008px] mx-auto h-px bg-neutral-200" />
    </div>
  );
}

export default function RentalWizard() {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;

  const [objectType, setObjectType] = useState<ObjectType>("event");
  const [selectedCabin, setSelectedCabin] = useState<CabinType>("standard");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  const trip = useAddressTrip();
  const [cleaning, setCleaning] = useState(true);
  const [expressMounting, setExpressMounting] = useState(true);
  const [installNotice, setInstallNotice] = useState(false);
  const [contactType, setContactType] = useState<ContactType>("individual");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const calendarRef = useRef<HTMLDivElement>(null);

  const timeOptions = Array.from({ length: 24 }, (_, h) => [
    { time: `${String(h).padStart(2, "0")}:00` },
    { time: `${String(h).padStart(2, "0")}:30` },
  ]).flat();

  useEffect(() => {
    if (!calendarOpen) return;
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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

  const formatDate = (d: Date): string =>
    d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

  const cabinLabels: Record<CabinType, string> = {
    standard: t("wizard.cabins.standard"),
    lux: t("wizard.cabins.lux"),
    vip: t("wizard.cabins.vip"),
  };

  const objectTypes: { key: ObjectType; label: string; description: string }[] = [
    { key: "event", label: t(`${k}.step1Event`), description: t(`${k}.step1EventDesc`) },
    { key: "construction", label: t(`${k}.step1Construction`), description: t(`${k}.step1ConstructionDesc`) },
    { key: "emergency", label: t(`${k}.step1Emergency`), description: t(`${k}.step1EmergencyDesc`) },
  ];

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
        <div
          className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#f1f1f1] to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-[1216px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-0.5 text-xs font-body mb-2 lg:mb-8">
            <Link to="/" className="text-[#2d84c1] underline leading-4 text-xs px-[10px] py-[8px]">
              {t(`${k}.breadcrumbHome`)}
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-neutral-500" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-neutral-500 leading-4 text-xs px-[10px] py-[8px]">{t(`${k}.title`)}</span>
          </nav>

          <h1 className="font-heading text-[32px] lg:text-[56px] font-extrabold leading-[32px] lg:leading-[56px] text-cta-main">
            {t(`${k}.title`)}
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
          {t(`${k}.title`)}
        </p>
      </section>

      {/* Step 1: Тип объекта */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={1} title={t(`${k}.step1Title`)} />
          <div className="mt-4 flex flex-col lg:flex-row gap-4 lg:gap-8">
            {objectTypes.map((opt) => (
              <div key={opt.key} className="flex-1 min-w-0 py-4">
                <RadioRow
                  selected={objectType === opt.key}
                  onClick={() => setObjectType(opt.key)}
                  label={opt.label}
                  description={opt.description}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionSeparator />

      {/* Step 2: Выбор кабин */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={2} title={t(`${k}.step2Title`)} />
          <div className="mt-4 py-4 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-4 lg:gap-4">
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
                    className={`size-5 shrink-0 rounded-full overflow-hidden ${
                      selectedCabin === type
                        ? "bg-cta-main flex items-center justify-center"
                        : "border border-neutral-500"
                    }`}
                  >
                    {selectedCabin === type && <span className="size-[6px] rounded-full bg-white" />}
                  </span>
                  <span className="font-body text-xl leading-6 text-neutral-900">
                    {cabinLabels[type]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <SectionSeparator />

      {/* Step 3: Период аренды */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={3} title={t(`${k}.step3Title`)} />
          <div className="mt-4 py-6 flex flex-col lg:flex-row items-start gap-4 lg:gap-8">
            <div className="relative w-full lg:w-[280px]" ref={calendarRef}>
              <button
                type="button"
                onClick={() => setCalendarOpen((v) => !v)}
                className={`flex h-10 w-full items-center rounded-[8px] border border-neutral-400 bg-white px-[11px] text-left font-body text-base leading-6 ${
                  startDate ? "text-neutral-900" : "text-neutral-300"
                }`}
              >
                {startDate ? formatDate(startDate) : t(`${k}.step3StartDate`)}
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

            <div className="flex gap-4 w-full lg:w-auto">
              <TimeDropdown
                options={timeOptions}
                value={startTime}
                onChange={setStartTime}
                isOpen={startTimeOpen}
                onToggle={() => setStartTimeOpen((v) => !v)}
                placeholder={t(`${k}.step3StartTime`)}
                className="flex-1 lg:w-[124px]"
              />
              <TimeDropdown
                options={timeOptions}
                value={endTime}
                onChange={setEndTime}
                isOpen={endTimeOpen}
                onToggle={() => setEndTimeOpen((v) => !v)}
                placeholder={t(`${k}.step3EndTime`)}
                className="flex-1 lg:w-[124px]"
              />
            </div>
          </div>
        </div>
      </section>

      <SectionSeparator />

      {/* Step 4: Адрес доставки */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={4} title={t(`${k}.step4Title`)} />
          <div className="mt-4 py-6 flex flex-col gap-2">
            <AddressList
              items={trip.items}
              onChange={trip.setText}
              onSelect={trip.setLocation}
              onAdd={trip.addEntry}
              onRemove={trip.removeEntry}
              placeholder={t(`${k}.step4Placeholder`)}
              addLabel={t(`${k}.step4AddAddress`)}
            />
            <MapPicker
              points={trip.locations}
              onMapClick={trip.appendFromMap}
              route={trip.trip?.geometry ?? []}
              loading={trip.loading}
              loadingText={t(`${k}.step4RouteLoading`)}
              className="mt-0 h-[300px] lg:h-[550px]"
            />
            {!trip.loading && trip.error && (
              <div className="mt-2 font-body text-base text-red-600">
                {t(`${k}.step4RouteError`)}
              </div>
            )}
            {!trip.loading && !trip.error && trip.trip && (
              <div className="mt-2 flex flex-col lg:flex-row gap-2 lg:gap-6 font-body text-base text-neutral-900">
                <span>
                  {t(`${k}.step4Distance`)}:{" "}
                  <strong>{trip.distanceKm.toFixed(1)} {t(`${k}.step4Km`)}</strong>
                </span>
                <span>
                  {t(`${k}.step4DeliveryCost`)}:{" "}
                  <strong className="text-cta-main">
                    {trip.deliveryCost.toLocaleString("ru-RU")} {t(`${k}.currency`)}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <SectionSeparator />

      {/* Step 5: Доп. опции */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={5} title={t(`${k}.step5Title`)} />
          <div className="mt-8 lg:mt-4 lg:py-6 flex flex-col lg:flex-row gap-8 lg:gap-[72px]">
            <Toggle checked={cleaning} onChange={setCleaning} label={t(`${k}.step5Cleaning`)} />
            <Toggle
              checked={expressMounting}
              onChange={setExpressMounting}
              label={t(`${k}.step5ExpressMounting`)}
            />
            <Toggle
              checked={installNotice}
              onChange={setInstallNotice}
              label={t(`${k}.step5InstallNotice`)}
            />
          </div>
        </div>
      </section>

      <SectionSeparator />

      {/* Step 6: Контакты */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={6} title={t(`${k}.step6Title`)} />
          <div className="mt-8 lg:mt-4 lg:py-6 flex flex-col gap-8">
            <div className="flex flex-row gap-2 lg:gap-[72px]">
              <button
                type="button"
                onClick={() => setContactType("individual")}
                className="flex flex-1 lg:flex-initial items-center gap-2"
              >
                <span
                  className={`size-5 shrink-0 rounded-full overflow-hidden ${
                    contactType === "individual"
                      ? "bg-cta-main flex items-center justify-center"
                      : "border border-neutral-500"
                  }`}
                >
                  {contactType === "individual" && <span className="size-[6px] rounded-full bg-white" />}
                </span>
                <span
                  className={`font-body text-xl leading-6 ${
                    contactType === "individual" ? "text-neutral-900" : "text-neutral-600"
                  }`}
                >
                  {t(`${k}.step6Individual`)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setContactType("legal")}
                className="flex flex-1 lg:flex-initial items-center gap-2"
              >
                <span
                  className={`size-5 shrink-0 rounded-full overflow-hidden ${
                    contactType === "legal"
                      ? "bg-cta-main flex items-center justify-center"
                      : "border border-neutral-500"
                  }`}
                >
                  {contactType === "legal" && <span className="size-[6px] rounded-full bg-white" />}
                </span>
                <span
                  className={`font-body text-xl leading-6 ${
                    contactType === "legal" ? "text-neutral-900" : "text-neutral-600"
                  }`}
                >
                  {t(`${k}.step6Legal`)}
                </span>
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
              <div className="flex flex-col gap-2 w-full lg:w-[280px]">
                <label className="font-body text-xl leading-6 text-neutral-600">
                  {t(`${k}.step6Name`)}
                </label>
                <BasicInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t(`${k}.step6Placeholder`)}
                  className="!h-10"
                />
              </div>
              <div className="flex flex-col gap-2 w-full lg:w-[280px]">
                <label className="font-body text-xl leading-6 text-neutral-600">
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
                <label className="font-body text-xl leading-6 text-neutral-600">
                  {t(`${k}.step6Email`)}
                </label>
                <BasicInput
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t(`${k}.step6Placeholder`)}
                  className="!h-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionSeparator />

      {/* Price + submit */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 pt-8 lg:pt-12 pb-16 lg:pb-[104px]">
        <div className="lg:px-[104px] flex flex-col lg:flex-row items-stretch lg:items-center gap-6">
          <div className="flex items-center gap-2 whitespace-nowrap justify-end lg:justify-start">
            <span className="font-body text-xl leading-6 text-neutral-900">
              {t(`${k}.price`)}
            </span>
            <span className="font-body font-semibold text-2xl leading-8 text-cta-main">
              125 000
            </span>
            <span className="font-body text-xl leading-6 text-neutral-900">
              {t(`${k}.currency`)}
            </span>
          </div>
          <button
            type="button"
            className="flex items-center justify-between gap-4 bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white font-body font-semibold text-base leading-6 rounded-[40px] pl-10 pr-8 py-3 w-full lg:w-[272px]"
          >
            <span>{t(`${k}.submit`)}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9.51 4.23l8.56 4.28c3.84 1.92 3.84 5.06 0 6.98l-8.56 4.28c-5.76 2.88-8.11.52-5.23-5.23l.87-1.73a1.88 1.88 0 000-1.63l-.87-1.74C1.4 3.71 3.76 1.35 9.51 4.23z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M5.44 12h5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </section>

      <RentalFaq />
    </div>
  );
}
