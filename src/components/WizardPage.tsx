import { useState, useRef, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { StepHeader, Calendar, MapPicker, AddressList } from "./ui";
import { useAddressTrip } from "../hooks/useAddressTrip";
import { useOrderSubmit } from "../hooks/useOrderSubmit";
import { useOrderPreview } from "../hooks/useOrderPreview";
import { useSanitationAvailability, dateKey } from "../hooks/useAvailabilityCalendar";
import {
  createSanitationOrder,
  previewSanitationOrder,
  type SanitationOrderPayload,
} from "../services/orderService";
import ContactsSection, { type ContactsValue } from "./wizards/shared/ContactsSection";
import Faq from "./Faq";
import Seo from "./Seo";

type Frequency = 1 | 2 | 3;

// TODO(backend): load from GET /api/pricing/sanitation-norms/
const MACHINE_CAPACITY = 30;
const CREW_CAPACITY = 30;

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
      <span className={`font-body text-base lg:text-xl leading-6 ${checked ? "text-neutral-900" : "text-neutral-600"}`}>
        {label}
      </span>
    </div>
  );
}

function RadioOption({
  selected,
  onClick,
  label,
  disabled = false,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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

function FrequencySelector({
  enabled,
  value,
  onChange,
  labels,
}: {
  enabled: boolean;
  value: Frequency;
  onChange: (v: Frequency) => void;
  labels: Record<Frequency, string>;
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:gap-8">
      {([1, 2, 3] as Frequency[]).map((f) => (
        <RadioOption
          key={f}
          selected={value === f}
          onClick={() => onChange(f)}
          label={labels[f]}
          disabled={!enabled}
        />
      ))}
    </div>
  );
}

export type WizardConfig = {
  pageKey: "sanitation";
  breadcrumbLabel: string;
  heroTitle: string;
  warning?: ReactNode;
};

export default function WizardPage({ pageKey, breadcrumbLabel, heroTitle, warning }: WizardConfig) {
  const { t } = useTranslation();

  const k = `wizard.${pageKey}` as const;

  const [cabinCount, setCabinCount] = useState(0);
  const trip = useAddressTrip("sanitation");

  const [serviceEnabled, setServiceEnabled] = useState(true);
  const [serviceFrequency, setServiceFrequency] = useState<Frequency>(1);

  const [cleaningEnabled, setCleaningEnabled] = useState(true);
  const [cleaningFrequency, setCleaningFrequency] = useState<Frequency>(1);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [durationWeeks, setDurationWeeks] = useState<number>(1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [contacts, setContacts] = useState<ContactsValue>({
    contactType: "individual",
    name: "",
    phone: "",
    email: "",
  });

  const machineCount = cabinCount > 0 ? Math.ceil(cabinCount / MACHINE_CAPACITY) : 0;
  const crewCount = cabinCount > 0 ? Math.ceil(cabinCount / CREW_CAPACITY) : 0;

  const atLeastOneService = serviceEnabled || cleaningEnabled;

  const firstLocation = trip.locations[0] ?? null;
  const startIso = startDate ? new Date(startDate.setHours(10, 0, 0, 0)).toISOString() : null;

  const previewPayload: SanitationOrderPayload | null =
    firstLocation && cabinCount > 0 && atLeastOneService
      ? {
          address_lat: firstLocation.lat,
          address_lon: firstLocation.lng,
          address_text: trip.items[0]?.text ?? "",
          num_toilets: cabinCount,
          pump_frequency: serviceEnabled ? serviceFrequency : null,
          cleaning_frequency: cleaningEnabled ? cleaningFrequency : null,
          payment_channel: contacts.contactType,
          date_start: startIso,
          weeks: durationWeeks,
        }
      : null;

  const preview = useOrderPreview(previewPayload, previewSanitationOrder);
  // BUG-017: do NOT fall back to a hard-coded demo price while inputs are
  // incomplete — show 0 (PriceSubmit renders «—» for 0 via its default).
  const totalPrice = preview.data ? Number(preview.data.total) : 0;

  const availability = useSanitationAvailability();
  const startDateAvailability = startDate ? availability.dayMap.get(dateKey(startDate)) : null;
  const insufficientTrucks =
    startDateAvailability != null && machineCount > startDateAvailability.trucksAvailable;
  const insufficientCleaners =
    startDateAvailability != null && crewCount > startDateAvailability.cleanersAvailable;
  const hasShortage = insufficientTrucks || insufficientCleaners;

  const wizardSubmit = useOrderSubmit({
    contacts,
    canProceed: atLeastOneService && !!previewPayload,
    buildOrder: async () => {
      if (!previewPayload) throw new Error("payload not ready");
      return createSanitationOrder(previewPayload);
    },
  });

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

  const formatDate = (d: Date): string => {
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const frequencyLabels: Record<Frequency, string> = {
    1: t(`${k}.step3Freq1`),
    2: t(`${k}.step3Freq2`),
    3: t(`${k}.step3Freq3`),
  };

  return (
    <div className="bg-white overflow-x-clip">
      <Seo pageKey={pageKey} />
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
            <span className="text-neutral-500 leading-4 text-xs px-[10px] py-[8px]">{breadcrumbLabel}</span>
          </nav>

          <h1 className="font-heading text-[32px] lg:text-[56px] font-extrabold leading-[32px] lg:leading-[56px] text-cta-main">
            {heroTitle}
          </h1>
        </div>

        <p
          className="hidden lg:block absolute right-[230px] top-[100px] font-heading text-[144px] font-extrabold leading-[56px] pointer-events-none select-none"
          style={{ color: "transparent", WebkitTextStroke: "1.5px rgba(89, 176, 2, 0.15)" }}
          aria-hidden="true"
        >
          {heroTitle}
        </p>
      </section>

      {warning && (
        <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-4">
          <div className="flex gap-2 items-start bg-[#fff7de] border border-[#f2bc70] rounded-[8px] p-4 lg:py-4 lg:pl-6 lg:pr-4 shadow-[0px_6px_8px_0px_rgba(0,0,0,0.08)]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#e7a74c] mt-0.5">
              <path d="M12 9v4M12 16h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="font-body text-base leading-6 text-neutral-900">{warning}</p>
          </div>
        </section>
      )}

      {/* Step 1: Cabin count */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px] px-[12px] lg:px-0">
          <StepHeader step={1} title={t(`${k}.step1Title`)} />
          <div className="mt-4 py-4 flex flex-col gap-2">
            <p className="font-body text-base lg:text-xl leading-6 text-neutral-900 lg:text-neutral-600">
              {t(`${k}.step1Question`)}
            </p>
            <div className="flex items-center gap-2 w-[160px]">
              <button
                type="button"
                onClick={() => setCabinCount(Math.max(0, cabinCount - 1))}
                className="shrink-0 size-8 rounded-full bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to flex items-center justify-center text-white"
                aria-label="Уменьшить"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <input
                type="number"
                value={cabinCount}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (!isNaN(n) && n >= 0) setCabinCount(n);
                }}
                className="h-10 flex-1 min-w-0 rounded-[8px] border border-neutral-400 bg-white px-2 text-center font-body text-xl text-neutral-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setCabinCount(cabinCount + 1)}
                className="shrink-0 size-8 rounded-full bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to flex items-center justify-center text-white"
                aria-label="Увеличить"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="font-body text-sm lg:text-base leading-4 lg:leading-6 text-neutral-500">
              {t(`${k}.step1Hint`)}
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 2: Address */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px] px-[12px] lg:px-0">
          <StepHeader step={2} title={t(`${k}.step2Title`)} />
          <div className="mt-4 py-4 lg:py-6 flex flex-col gap-2">
            <AddressList
              items={trip.items}
              onChange={trip.setText}
              onSelect={trip.setLocation}
              onAdd={trip.addEntry}
              onRemove={trip.removeEntry}
              placeholder={t(`${k}.step2Placeholder`)}
              addLabel={t(`${k}.step2AddAddress`)}
            />
            <MapPicker
              points={trip.locations}
              onMapClick={trip.appendFromMap}
              routes={trip.routes}
              warehouse={trip.warehouse ? { lat: trip.warehouse.lat, lng: trip.warehouse.lon } : null}
              loading={trip.loading}
              loadingText={t(`${k}.step2RouteLoading`)}
              className="mt-0 h-[374px] lg:h-[550px]"
            />
            {!trip.loading && trip.error && (
              <div className="mt-2 font-body text-base text-red-600">{t(`${k}.step2RouteError`)}</div>
            )}
            {!trip.loading && !trip.error && trip.hasPreview && (
              <div className="mt-2 flex flex-col lg:flex-row gap-2 lg:gap-6 font-body text-base text-neutral-900">
                <span>
                  {t(`${k}.step2Distance`)}: <strong>{trip.distanceKm.toFixed(1)} {t(`${k}.step2Km`)}</strong>
                </span>
                <span>
                  {t(`${k}.step2DeliveryCost`)}: <strong className="text-cta-main">{trip.deliveryCost.toLocaleString("ru-RU")} ₸</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 3: Service frequencies + resources */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px] px-[12px] lg:px-0">
          <StepHeader step={3} title={t(`${k}.step3Title`)} />

          <div className="mt-6 lg:mt-4 flex flex-col gap-8 lg:gap-10">
            <div className="flex flex-col gap-3">
              <Toggle
                checked={serviceEnabled}
                onChange={setServiceEnabled}
                label={t(`${k}.step3Service`)}
              />
              <FrequencySelector
                enabled={serviceEnabled}
                value={serviceFrequency}
                onChange={setServiceFrequency}
                labels={frequencyLabels}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Toggle
                checked={cleaningEnabled}
                onChange={setCleaningEnabled}
                label={t(`${k}.step3Cleaning`)}
              />
              <FrequencySelector
                enabled={cleaningEnabled}
                value={cleaningFrequency}
                onChange={setCleaningFrequency}
                labels={frequencyLabels}
              />
            </div>

            {!atLeastOneService && (
              <p className="font-body text-sm lg:text-base leading-4 lg:leading-6 text-red-600">
                {t(`${k}.step3ValidateAtLeastOne`)}
              </p>
            )}
            {cabinCount === 0 && (
              <p
                className="font-body text-sm lg:text-base leading-4 lg:leading-6 text-red-600"
                role="alert"
              >
                {t(`${k}.step3RequireAtLeastOneToilet`, {
                  defaultValue: "Укажите хотя бы один биотуалет",
                })}
              </p>
            )}
          </div>

          <h3 className="font-heading text-[20px] lg:text-[32px] font-extrabold leading-[24px] lg:leading-[32px] text-neutral-900 mt-10 lg:mt-12">
            {t(`${k}.step3Resources`)}
          </h3>
          <div className="mt-4 lg:py-2 flex flex-col gap-2">
            <p className="font-body text-base lg:text-xl leading-6 text-neutral-600">
              {t(`${k}.step3ResourcesRequired`)}{" "}
              <strong className="text-neutral-900">
                {machineCount} {t(`${k}.step3Machine`, { count: machineCount })}
                {" · "}
                {crewCount} {t(`${k}.step3Crew`, { count: crewCount })}
              </strong>
            </p>
            <p className="font-body text-sm lg:text-base leading-4 lg:leading-6 text-neutral-500">
              {t(`${k}.step3CalcHint`)}
            </p>
            {hasShortage && (
              <div className="mt-2 rounded-[8px] bg-[#fee7e2] border border-[#f2704f] p-4 font-body text-base leading-6 text-neutral-900 flex flex-col gap-1">
                {insufficientTrucks && startDateAvailability && (
                  <span>
                    {t(`${k}.step4TrucksShortage`, {
                      available: startDateAvailability.trucksAvailable,
                      required: machineCount,
                    })}
                  </span>
                )}
                {insufficientCleaners && startDateAvailability && (
                  <span>
                    {t(`${k}.step4CleanersShortage`, {
                      available: startDateAvailability.cleanersAvailable,
                      required: crewCount,
                    })}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 4: Start date + duration weeks */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px] px-[12px] lg:px-0">
          <StepHeader step={4} title={t(`${k}.step4Title`)} />
          <div className="mt-8 lg:mt-4 lg:py-6 flex flex-col lg:flex-row items-stretch lg:items-start gap-4 lg:gap-8">
            <div className="relative w-full lg:w-[280px]" ref={calendarRef}>
              <button
                type="button"
                onClick={() => setCalendarOpen((v) => !v)}
                className={`flex h-10 lg:h-[44px] w-full items-center rounded-[8px] border border-neutral-400 bg-white px-[11px] text-left font-body text-base leading-6 ${startDate ? "text-neutral-900" : "text-neutral-300"}`}
              >
                {startDate ? formatDate(startDate) : t(`${k}.step4StartDate`)}
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
                    dayMeta={(d) => {
                      const meta = availability.dayMap.get(dateKey(d));
                      if (!meta) return undefined;
                      const blocked = meta.trucksAvailable <= 0 && meta.cleanersAvailable <= 0;
                      return blocked
                        ? { blocked: true, reason: t(`${k}.step4FleetExhausted`) }
                        : undefined;
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 w-full lg:w-[200px]">
              <label className="font-body text-base lg:text-xl leading-6 text-neutral-600">
                {t(`${k}.step4DurationWeeks`)}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={durationWeeks}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!isNaN(n) && n >= 1 && n <= 52) setDurationWeeks(n);
                  }}
                  className="h-10 lg:h-[44px] flex-1 rounded-[8px] border border-neutral-400 bg-white px-3 font-body text-base leading-6 text-neutral-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="font-body text-base lg:text-xl leading-6 text-neutral-600">
                  {t(`${k}.step4DurationWeeksUnit`, {
                    count: durationWeeks,
                    defaultValue_one: "неделя",
                    defaultValue_few: "недели",
                    defaultValue_many: "недель",
                    defaultValue: "недель",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 5: Contacts */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px] px-[12px] lg:px-0">
          <StepHeader step={5} title={t(`${k}.step5Title`)} />
          <ContactsSection
            value={contacts}
            onChange={setContacts}
            errors={wizardSubmit.fieldErrors}
          />
        </div>
      </section>

      <Separator />

      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 pt-8 lg:pt-12 pb-16 lg:pb-[104px]">
        <div className="lg:px-[104px] px-[12px] lg:px-0 flex flex-col lg:flex-row items-stretch lg:items-center gap-6">
          <div className="flex items-center gap-2 whitespace-nowrap justify-end lg:justify-start">
            <span className="font-body text-xl text-neutral-900">{t(`${k}.price`)}</span>
            <span className="font-body font-semibold text-2xl leading-8 text-cta-main">{totalPrice.toLocaleString("ru-RU")}</span>
            <span className="font-body text-xl text-neutral-900">₸</span>
          </div>
          <div className="flex flex-col gap-2 w-full lg:w-[272px]">
            <button
              type="button"
              disabled={wizardSubmit.buttonDisabled}
              onClick={wizardSubmit.submit}
              className="flex items-center justify-between gap-4 bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white font-body font-semibold text-base rounded-[40px] pl-10 pr-8 py-3 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{t(`${k}.submit`)}</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9.51 4.23l8.56 4.28c3.84 1.92 3.84 5.06 0 6.98l-8.56 4.28c-5.76 2.88-8.11.52-5.23-5.23l.87-1.73a1.88 1.88 0 000-1.63l-.87-1.74C1.4 3.71 3.76 1.35 9.51 4.23z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.44 12h5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {!atLeastOneService && (
              <p className="font-body text-sm leading-4 text-red-600">{t(`${k}.step3ValidateAtLeastOne`)}</p>
            )}
            {atLeastOneService && wizardSubmit.validationError && (
              <p className="font-body text-sm leading-4 text-red-600">{wizardSubmit.validationError}</p>
            )}
            {wizardSubmit.submitting && (
              <p className="font-body text-sm leading-4 text-neutral-500">{t("payment.uploader.submitting")}</p>
            )}
          </div>
        </div>
      </section>

      <Faq />
    </div>
  );
}
