import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { saveDraft, loadDraft, clearDraft } from "../../services/wizardDraft";
import InlineOtpGate from "./shared/InlineOtpGate";
import { Link } from "react-router-dom";
import { StepHeader, Calendar, MapPicker, AddressList } from "../ui";
import { useAddressTrip } from "../../hooks/useAddressTrip";
import { useZones } from "../../hooks/useZones";
import { useTimeSlots } from "../../hooks/useTimeSlots";
import { useServicePackages } from "../../hooks/useServicePackages";
import { deliveryLabel } from "../../utils/deliveryLabel";
import { useOrderSubmit } from "../../hooks/useOrderSubmit";
import { useOrderPreview } from "../../hooks/useOrderPreview";
import { useSanitationAvailability, dateKey } from "../../hooks/useAvailabilityCalendar";
import {
  validateServiceSubtype,
  type ServiceSubtype,
  type SanitationSubtypeReason,
} from "../../utils/serviceSubtypeValidator";
import {
  createServiceOrder,
  previewServiceOrder,
  type ServiceOrderPayload,
} from "../../services/orderService";
import { uploadIdDocuments } from "../../services/idDocumentService";
import { validateIdDocument } from "../../utils/idDocument";
import {
  ContactsSection,
  Toggle,
  Separator,
  SubtypeSelector,
  ServicePackageSelector,
  PeriodPicker,
  type ContactsValue,
} from "./shared";
import Faq from "../Faq";
import Seo from "../Seo";

// TODO(backend): load from GET /api/pricing/sanitation-norms/
const MACHINE_CAPACITY = 30;
const CREW_CAPACITY = 30;

const DRAFT_SLUG = "service" as const;

type ServiceDraft = {
  cabinCount: number;
  subtype: ServiceSubtype;
  hasPumping: boolean;
  hasWashing: boolean;
  oneTimeDate: string | null;
  oneTimeSlotId: number | null;
  packageId: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  contacts: ContactsValue;
};

export default function ServiceWizard() {
  const { t } = useTranslation();
  const k = "wizard.service";
  const breadcrumbLabel = t("buttons.service");
  const heroTitle = t("wizard.service.title");
  const warning = t("wizard.service.warning");

  // Draft hydration via useState initializers (runs once, no effects needed).
  // Trip items are NOT restored — useAddressTrip exposes no hydrate/replace API;
  // only internal setItems mutations are available.

  // --- Step 1: cabin count ---
  const [cabinCount, setCabinCount] = useState(() => {
    const draft = loadDraft<ServiceDraft>(DRAFT_SLUG);
    return draft?.cabinCount ?? 0;
  });
  const [cabinCountInput, setCabinCountInput] = useState<string>(() => {
    const draft = loadDraft<ServiceDraft>(DRAFT_SLUG);
    return String(draft?.cabinCount ?? 0);
  });

  // --- Step 2: address ---
  const trip = useAddressTrip("sanitation");
  const { zones } = useZones("sanitation");
  const firstLocation = trip.locations[0] ?? null;

  // --- Step 3: subtype + options + package/one-time ---
  const [subtype, setSubtype] = useState<ServiceSubtype>(() => {
    const draft = loadDraft<ServiceDraft>(DRAFT_SLUG);
    return draft?.subtype ?? "MONTHLY";
  });
  const [hasPumping, setHasPumping] = useState(() => {
    const draft = loadDraft<ServiceDraft>(DRAFT_SLUG);
    return draft?.hasPumping ?? true;
  });
  const [hasWashing, setHasWashing] = useState(() => {
    const draft = loadDraft<ServiceDraft>(DRAFT_SLUG);
    return draft?.hasWashing ?? false;
  });

  const { slots, loading: slotsLoading } = useTimeSlots();
  const { packages, loading: packagesLoading } = useServicePackages();

  const [oneTimeDate, setOneTimeDate] = useState<Date | null>(() => {
    const draft = loadDraft<ServiceDraft>(DRAFT_SLUG);
    return draft?.oneTimeDate ? new Date(draft.oneTimeDate) : null;
  });
  const [oneTimeSlotId, setOneTimeSlotId] = useState<number | null>(() => {
    const draft = loadDraft<ServiceDraft>(DRAFT_SLUG);
    return draft?.oneTimeSlotId ?? null;
  });
  const [oneTimeCalendarOpen, setOneTimeCalendarOpen] = useState(false);
  const oneTimeCalendarRef = useRef<HTMLDivElement>(null);

  const [packageId, setPackageId] = useState<number | null>(() => {
    const draft = loadDraft<ServiceDraft>(DRAFT_SLUG);
    return draft?.packageId ?? null;
  });

  // --- Step 4: period (MONTHLY only) ---
  const [periodStart, setPeriodStart] = useState<Date | null>(() => {
    const draft = loadDraft<ServiceDraft>(DRAFT_SLUG);
    return draft?.periodStart ? new Date(draft.periodStart) : null;
  });
  const [periodEnd, setPeriodEnd] = useState<Date | null>(() => {
    const draft = loadDraft<ServiceDraft>(DRAFT_SLUG);
    return draft?.periodEnd ? new Date(draft.periodEnd) : null;
  });

  // --- Step N: contacts ---
  const [contacts, setContacts] = useState<ContactsValue>(() => {
    const draft = loadDraft<ServiceDraft>(DRAFT_SLUG);
    return draft?.contacts ?? {
      contactType: "individual",
      name: "",
      phone: "",
      email: "",
    };
  });
  const [idDocumentFront, setIdDocumentFront] = useState<File | null>(null);
  const [idDocumentBack, setIdDocumentBack] = useState<File | null>(null);
  const [idDocumentFrontError, setIdDocumentFrontError] = useState<string | null>(null);
  const [idDocumentBackError, setIdDocumentBackError] = useState<string | null>(null);
  const validateAndSetIdDoc = (
    setter: (f: File | null) => void,
    setErr: (e: string | null) => void,
  ) => (f: File | null) => {
    setter(f);
    if (!f) {
      setErr(null);
      return;
    }
    const r = validateIdDocument(f);
    setErr(
      r.ok
        ? null
        : t(
            r.reason === "too_large"
              ? "wizard.contacts.idDocument.validationTooLarge"
              : "wizard.contacts.idDocument.validationBadMime",
          ),
    );
  };
  const setFrontWithValidation = validateAndSetIdDoc(
    setIdDocumentFront,
    setIdDocumentFrontError,
  );
  const setBackWithValidation = validateAndSetIdDoc(
    setIdDocumentBack,
    setIdDocumentBackError,
  );

  // Debounced save on every relevant state change.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveDraft<ServiceDraft>(DRAFT_SLUG, {
        cabinCount,
        subtype,
        hasPumping,
        hasWashing,
        oneTimeDate: oneTimeDate ? oneTimeDate.toISOString() : null,
        oneTimeSlotId,
        packageId,
        periodStart: periodStart ? periodStart.toISOString() : null,
        periodEnd: periodEnd ? periodEnd.toISOString() : null,
        contacts,
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    cabinCount,
    subtype,
    hasPumping,
    hasWashing,
    oneTimeDate,
    oneTimeSlotId,
    packageId,
    periodStart,
    periodEnd,
    contacts,
  ]);

  // --- derived ---
  const machineCount = cabinCount > 0 ? Math.ceil(cabinCount / MACHINE_CAPACITY) : 0;
  const crewCount = cabinCount > 0 ? Math.ceil(cabinCount / CREW_CAPACITY) : 0;

  const subtypeValidation = useMemo(
    () =>
      validateServiceSubtype({
        subtype,
        hasPumping,
        hasWashing,
        oneTimeDate,
        oneTimeSlotId,
        servicePackageId: packageId,
        periodStart,
        periodEnd,
      }),
    [
      subtype,
      hasPumping,
      hasWashing,
      oneTimeDate,
      oneTimeSlotId,
      packageId,
      periodStart,
      periodEnd,
    ],
  );

  const previewPayload: ServiceOrderPayload | null =
    firstLocation && cabinCount > 0 && subtypeValidation.ok
      ? {
          address_lat: firstLocation.lat,
          address_lon: firstLocation.lng,
          address_text: trip.items[0]?.text ?? "",
          num_toilets: cabinCount,
          payment_channel: contacts.contactType,
          ...subtypeValidation.payload,
        }
      : null;

  const preview = useOrderPreview(previewPayload, previewServiceOrder);
  const totalPrice = preview.data ? Number(preview.data.total) : 0;

  // Availability tied to whichever date is "the start" — period_start for MONTHLY,
  // one_time_date for ONE_TIME.
  const startDate = subtype === "MONTHLY" ? periodStart : oneTimeDate;
  const availability = useSanitationAvailability();
  const startDateAvailability = startDate ? availability.dayMap.get(dateKey(startDate)) : null;
  const insufficientTrucks =
    startDateAvailability != null && machineCount > startDateAvailability.trucksAvailable;
  const insufficientCleaners =
    startDateAvailability != null && crewCount > startDateAvailability.cleanersAvailable;
  const hasShortage = insufficientTrucks || insufficientCleaners;

  const wizardSubmit = useOrderSubmit({
    contacts,
    canProceed: !!previewPayload,
    buildOrder: async () => {
      if (!previewPayload) throw new Error("payload not ready");
      return createServiceOrder(previewPayload);
    },
    afterCreate: async (order) => {
      if (
        contacts.contactType === "individual" &&
        (idDocumentFront || idDocumentBack) &&
        !idDocumentFrontError &&
        !idDocumentBackError
      ) {
        await uploadIdDocuments(order.order_number, {
          front: idDocumentFront,
          back: idDocumentBack,
        });
      }
      clearDraft(DRAFT_SLUG);
    },
    onPendingAuthChange: (pending) => {
      if (pending) {
        saveDraft<ServiceDraft>(DRAFT_SLUG, {
          cabinCount,
          subtype,
          hasPumping,
          hasWashing,
          oneTimeDate: oneTimeDate ? oneTimeDate.toISOString() : null,
          oneTimeSlotId,
          packageId,
          periodStart: periodStart ? periodStart.toISOString() : null,
          periodEnd: periodEnd ? periodEnd.toISOString() : null,
          contacts,
        });
      }
    },
  });

  // close inline calendar on outside click
  useEffect(() => {
    if (!oneTimeCalendarOpen) return;
    const handle = (e: MouseEvent) => {
      if (
        oneTimeCalendarRef.current &&
        !oneTimeCalendarRef.current.contains(e.target as Node)
      ) {
        setOneTimeCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [oneTimeCalendarOpen]);

  const formatDate = (d: Date): string =>
    d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

  // disabledReason
  const reasonMap: Record<SanitationSubtypeReason, string> = {
    noOptionSelected: t(`${k}.options.atLeastOne`),
    noDateSelected: t(`${k}.oneTimeStep.noDateSelected`),
    noSlotSelected: t(`${k}.oneTimeStep.noSlotSelected`),
    noPackageSelected: t(`${k}.package.noneSelected`),
    noStart: t(`${k}.period.noStart`),
    noEnd: t(`${k}.period.noEnd`),
    endBeforeStart: t(`${k}.period.endBeforeStart`),
    periodTooShort: t(`${k}.period.tooShort`),
    periodTooLong: t(`${k}.period.tooLong`),
  };
  const subtypeReasonText: string | undefined = subtypeValidation.ok
    ? undefined
    : reasonMap[subtypeValidation.reason];

  // Step number bookkeeping (4 for ONE_TIME, 5 for MONTHLY).
  const periodStepNumber = subtype === "MONTHLY" ? 4 : null;
  const contactsStepNumber = subtype === "MONTHLY" ? 5 : 4;

  return (
    <div className="bg-white overflow-x-clip">
      <Seo pageKey="service" />
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
            <Link to="/" className="text-[#1F5F8F] underline leading-4 text-xs px-[10px] py-[8px]">
              Home
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
              {breadcrumbLabel}
            </span>
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
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0 text-[#e7a74c] mt-0.5"
            >
              <path
                d="M12 9v4M12 16h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
                onClick={() => {
                  const next = Math.max(0, cabinCount - 1);
                  setCabinCount(next);
                  setCabinCountInput(String(next));
                }}
                className="shrink-0 size-8 rounded-full bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to flex items-center justify-center text-white"
                aria-label="Уменьшить"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <input
                type="number"
                value={cabinCountInput}
                aria-label="Количество кабин"
                onChange={(e) => {
                  const raw = e.target.value;
                  setCabinCountInput(raw);
                  if (raw === "") {
                    setCabinCount(0);
                    return;
                  }
                  const n = parseInt(raw, 10);
                  if (!isNaN(n) && n >= 0) setCabinCount(n);
                }}
                onBlur={() => {
                  if (cabinCountInput === "" || isNaN(parseInt(cabinCountInput, 10))) {
                    setCabinCount(0);
                    setCabinCountInput("0");
                  } else {
                    setCabinCountInput(String(cabinCount));
                  }
                }}
                className="h-10 flex-1 min-w-0 rounded-[8px] border border-neutral-400 bg-white px-2 text-center font-body text-xl text-neutral-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => {
                  const next = cabinCount + 1;
                  setCabinCount(next);
                  setCabinCountInput(String(next));
                }}
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
              onSelect={trip.setEntry}
              onAdd={trip.addEntry}
              onRemove={trip.removeEntry}
              placeholder={t(`${k}.step2Placeholder`)}
              addLabel={t(`${k}.step2AddAddress`)}
            />
            <MapPicker
              points={trip.locations}
              onMapClick={trip.appendFromMap}
              routes={trip.routes}
              warehouse={
                trip.warehouse ? { lat: trip.warehouse.lat, lng: trip.warehouse.lon } : null
              }
              loading={trip.loading}
              loadingText={t(`${k}.step2RouteLoading`)}
              className="mt-0 h-[374px] lg:h-[550px]"
              zones={zones}
            />
            {!trip.loading && trip.error && (
              <div className="mt-2 font-body text-base text-red-600">
                {t(`${k}.step2RouteError`)}
              </div>
            )}
            {!trip.loading && !trip.error && trip.hasPreview && (
              <div className="mt-2 flex flex-col gap-2 font-body text-base text-neutral-900">
                {trip.legs.map((leg, i) =>
                  leg.preview ? (
                    <div
                      key={`${leg.location.lat}-${leg.location.lng}-${i}`}
                      className="flex flex-col lg:flex-row lg:gap-6"
                    >
                      <span>
                        {t(`${k}.step2Address`, { defaultValue: "Адрес" })} {i + 1}:{" "}
                        <strong>{deliveryLabel(leg.preview, t)}</strong>
                      </span>
                      <span className="text-cta-main">
                        {Math.round(leg.preview.deliveryFee).toLocaleString("ru-RU")} ₸
                      </span>
                    </div>
                  ) : null,
                )}
                <div className="flex flex-col lg:flex-row gap-2 lg:gap-6 border-t border-neutral-200 pt-2">
                  <span>
                    {t(`${k}.step2Distance`)}:{" "}
                    <strong>
                      {trip.distanceKm.toFixed(1)} {t(`${k}.step2Km`)}
                    </strong>
                  </span>
                  <span>
                    {t(`${k}.step2DeliveryCost`)}:{" "}
                    <strong className="text-cta-main">
                      {trip.deliveryCost.toLocaleString("ru-RU")} ₸
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 3: subtype + options + package OR one-time picker + resources */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px] px-[12px] lg:px-0">
          <StepHeader step={3} title={t(`${k}.subtype.title`)} />
          <SubtypeSelector value={subtype} onChange={setSubtype} />

          <div className="mt-8 flex flex-col gap-3">
            <h3 className="font-body text-lg lg:text-xl leading-6 text-neutral-900">
              {t(`${k}.options.title`)}
            </h3>
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-8">
              <Toggle
                checked={hasPumping}
                onChange={setHasPumping}
                label={t(`${k}.options.hasPumping`)}
              />
              <Toggle
                checked={hasWashing}
                onChange={setHasWashing}
                label={t(`${k}.options.hasWashing`)}
              />
            </div>
            {!hasPumping && !hasWashing && (
              <p className="font-body text-sm leading-4 text-red-600">
                {t(`${k}.options.atLeastOne`)}
              </p>
            )}
          </div>

          {subtype === "MONTHLY" && (
            <div className="mt-8">
              <h3 className="font-body text-lg lg:text-xl leading-6 text-neutral-900">
                {t(`${k}.package.title`)}
              </h3>
              <ServicePackageSelector
                packages={packages}
                loading={packagesLoading}
                value={packageId}
                onChange={setPackageId}
              />
            </div>
          )}

          {subtype === "ONE_TIME" && (
            <div className="mt-8 flex flex-col lg:flex-row gap-4 lg:gap-8">
              <div className="flex flex-col gap-2 w-full lg:w-[280px]">
                <label className="font-body text-base lg:text-xl leading-6 text-neutral-600">
                  {t(`${k}.oneTimeStep.dateLabel`)}
                </label>
                <div className="relative w-full" ref={oneTimeCalendarRef}>
                  <button
                    type="button"
                    onClick={() => setOneTimeCalendarOpen((v) => !v)}
                    className={`flex h-10 lg:h-[44px] w-full items-center rounded-[8px] border border-neutral-400 bg-white px-[11px] text-left font-body text-base leading-6 ${
                      oneTimeDate ? "text-neutral-900" : "text-neutral-500"
                    }`}
                  >
                    {oneTimeDate
                      ? formatDate(oneTimeDate)
                      : t(`${k}.oneTimeStep.datePlaceholder`)}
                  </button>
                  {oneTimeCalendarOpen && (
                    <div className="absolute top-full left-0 z-50 mt-1">
                      <Calendar
                        mode="single"
                        value={oneTimeDate}
                        onChange={(d) => {
                          setOneTimeDate(d as Date);
                          setOneTimeCalendarOpen(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full lg:w-[280px]">
                <label className="font-body text-base lg:text-xl leading-6 text-neutral-600">
                  {t(`${k}.oneTimeStep.slotLabel`)}
                </label>
                <select
                  className="h-10 lg:h-[44px] rounded-[8px] border border-neutral-400 bg-white px-[11px] font-body text-base leading-6 text-neutral-900"
                  value={oneTimeSlotId ?? ""}
                  onChange={(e) =>
                    setOneTimeSlotId(e.target.value === "" ? null : Number(e.target.value))
                  }
                  disabled={slotsLoading || slots.length === 0}
                >
                  <option value="">
                    {slotsLoading
                      ? t(`${k}.oneTimeStep.slotsLoading`)
                      : slots.length === 0
                        ? t(`${k}.oneTimeStep.slotsEmpty`)
                        : t(`${k}.oneTimeStep.slotPlaceholder`)}
                  </option>
                  {slots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

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

      {/* Step 4: period (MONTHLY only) */}
      {subtype === "MONTHLY" && periodStepNumber !== null && (
        <>
          <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
            <div className="lg:px-[104px] px-[12px] lg:px-0">
              <StepHeader step={periodStepNumber} title={t(`${k}.period.title`)} />
              <PeriodPicker
                start={periodStart}
                end={periodEnd}
                onStartChange={setPeriodStart}
                onEndChange={setPeriodEnd}
              />
            </div>
          </section>
          <Separator />
        </>
      )}

      {/* Step N: Contacts */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px] px-[12px] lg:px-0">
          <StepHeader step={contactsStepNumber} title={t(`${k}.step5Title`)} />
          <ContactsSection
            value={contacts}
            onChange={setContacts}
            errors={wizardSubmit.fieldErrors}
            idDocumentFront={{
              value: idDocumentFront,
              onChange: setFrontWithValidation,
              error: idDocumentFrontError ?? undefined,
            }}
            idDocumentBack={{
              value: idDocumentBack,
              onChange: setBackWithValidation,
              error: idDocumentBackError ?? undefined,
            }}
          />
        </div>
      </section>

      <Separator />

      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 pt-8 lg:pt-12 pb-16 lg:pb-[104px]">
        <div className="lg:px-[104px] px-[12px] lg:px-0 flex flex-col lg:flex-row items-stretch lg:items-center gap-6">
          <div className="flex items-center gap-2 whitespace-nowrap justify-end lg:justify-start">
            <span className="font-body text-xl text-neutral-900">{t(`${k}.price`)}</span>
            <span className="font-body font-semibold text-2xl leading-8 text-cta-main">
              {totalPrice.toLocaleString("ru-RU")}
            </span>
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
                <path
                  d="M9.51 4.23l8.56 4.28c3.84 1.92 3.84 5.06 0 6.98l-8.56 4.28c-5.76 2.88-8.11.52-5.23-5.23l.87-1.73a1.88 1.88 0 000-1.63l-.87-1.74C1.4 3.71 3.76 1.35 9.51 4.23z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.44 12h5.4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {cabinCount === 0 && (
              <p className="font-body text-sm leading-4 text-red-600">
                {t(`${k}.step3RequireAtLeastOneToilet`, {
                  defaultValue: "Укажите хотя бы один биотуалет",
                })}
              </p>
            )}
            {subtypeReasonText && (
              <p className="font-body text-sm leading-4 text-red-600">{subtypeReasonText}</p>
            )}
            {wizardSubmit.validationError && (
              <p className="font-body text-sm leading-4 text-red-600">
                {wizardSubmit.validationError}
              </p>
            )}
            {wizardSubmit.submitting && (
              <p className="font-body text-sm leading-4 text-neutral-500">
                {t("payment.uploader.submitting")}
              </p>
            )}
          </div>
        </div>
      </section>

      <Faq />

      {wizardSubmit.pendingAuth && (
        <InlineOtpGate
          phone={contacts.phone}
          onSuccess={() => {
            // useOrderSubmit auto-runs buildOrder via authStatus useEffect
          }}
          onChangePhone={wizardSubmit.cancelPendingAuth}
        />
      )}
    </div>
  );
}
