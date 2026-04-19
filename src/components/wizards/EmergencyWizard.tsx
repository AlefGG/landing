import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAddressTrip } from "../../hooks/useAddressTrip";
import { useCabinTypes, findCabinIdBySlug } from "../../hooks/useCabinTypes";
import { useOrderSubmit } from "../../hooks/useOrderSubmit";
import { useOrderPreview } from "../../hooks/useOrderPreview";
import { useRentalAvailability, dateKey } from "../../hooks/useAvailabilityCalendar";
import {
  createRentalOrder,
  previewRentalOrder,
  type RentalOrderPayload,
} from "../../services/orderService";
import RentalFaq from "../RentalFaq";
import {
  StepLabel,
  Separator,
  CabinSelector,
  ContactsSection,
  PriceSubmit,
  Toggle,
  SurchargeNotice,
  BASE_DAY_PRICE,
  EMERGENCY_SURCHARGE_RATE,
  type CabinType,
  type ContactsValue,
} from "./shared";
import DateTimeRange, { type DateTimeRangeValue } from "./shared/DateTimeRange";
import AddressStep from "./shared/AddressStep";

function toIsoDateTime(date: Date, time: string): string | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export default function EmergencyWizard() {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;
  const ek = "wizard.emergency" as const;

  const [selectedCabin, setSelectedCabin] = useState<CabinType>("standard");
  const [dateTime, setDateTime] = useState<DateTimeRangeValue>({
    startDate: null,
    startTime: "",
    endTime: "",
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  const trip = useAddressTrip("rental");
  const [cleaning, setCleaning] = useState(true);
  const [contacts, setContacts] = useState<ContactsValue>({
    contactType: "individual",
    name: "",
    phone: "",
    email: "",
  });

  const { types: cabinTypes } = useCabinTypes("rental");
  const cabinTypeId = findCabinIdBySlug(cabinTypes, selectedCabin);

  const availability = useRentalAvailability("rental_emergency", cabinTypeId);
  const startDateBlocked = useMemo(() => {
    if (!dateTime.startDate) return { blocked: false, reason: null as string | null };
    const meta = availability.dayMap.get(dateKey(dateTime.startDate));
    return { blocked: meta?.blocked ?? false, reason: meta?.reason ?? null };
  }, [dateTime.startDate, availability.dayMap]);

  const startIso = dateTime.startDate
    ? toIsoDateTime(dateTime.startDate, dateTime.startTime)
    : null;
  const endIso = dateTime.startDate
    ? toIsoDateTime(dateTime.startDate, dateTime.endTime)
    : null;
  const firstLocation = trip.locations[0] ?? null;

  const previewPayload: RentalOrderPayload | null =
    cabinTypeId && startIso && endIso && endIso > startIso && firstLocation
      ? {
          service_type: "rental_emergency",
          date_start: startIso,
          date_end: endIso,
          address_lat: firstLocation.lat,
          address_lon: firstLocation.lng,
          address_text: trip.items[0]?.text ?? "",
          logistics_type: "standard",
          payment_channel: contacts.contactType,
          items: [{ cabin_type: cabinTypeId, quantity: 1 }],
        }
      : null;

  const preview = useOrderPreview(previewPayload, previewRentalOrder);

  const fallbackSurcharge = Math.round(BASE_DAY_PRICE * EMERGENCY_SURCHARGE_RATE);
  const fallbackTotal = BASE_DAY_PRICE + fallbackSurcharge;
  const totalPrice = preview.data ? Number(preview.data.total) : fallbackTotal;
  const surchargeAmount = preview.data
    ? Math.round(Number(preview.data.total) * EMERGENCY_SURCHARGE_RATE / (1 + EMERGENCY_SURCHARGE_RATE))
    : fallbackSurcharge;

  const submitState = useOrderSubmit({
    contacts,
    canProceed: !startDateBlocked.blocked && !!previewPayload,
    buildOrder: async () => {
      if (!previewPayload) throw new Error("payload not ready");
      return createRentalOrder(previewPayload);
    },
  });

  return (
    <>
      {/* Banner */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
        <div className="flex gap-2 items-start bg-[#fee7e2] border border-[#f2704f] rounded-[8px] p-4 lg:py-4 lg:pl-6 lg:pr-4 shadow-[0px_6px_8px_0px_rgba(0,0,0,0.08)]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#e0533a] mt-0.5">
            <path d="M12 9v4M12 16h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="font-body text-base leading-6 text-neutral-900">{t(`${ek}.banner`)}</p>
        </div>
      </section>

      {/* Step 1: Cabins */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={1} title={t(`${k}.step2Title`)} />
          <CabinSelector value={selectedCabin} onChange={setSelectedCabin} />
        </div>
      </section>

      <Separator />

      {/* Step 2: Period */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={2} title={t(`${k}.step3Title`)} />
          <DateTimeRange
            value={dateTime}
            onChange={setDateTime}
            labels={{
              startDate: t(`${k}.step3StartDate`),
              startTime: t(`${k}.step3StartTime`),
              endTime: t(`${k}.step3EndTime`),
            }}
            calendarOpen={calendarOpen}
            onToggleCalendar={() => setCalendarOpen((v) => !v)}
            startTimeOpen={startTimeOpen}
            onToggleStartTime={() => setStartTimeOpen((v) => !v)}
            endTimeOpen={endTimeOpen}
            onToggleEndTime={() => setEndTimeOpen((v) => !v)}
            dayMeta={(d) => {
              const meta = availability.dayMap.get(dateKey(d));
              return meta
                ? { blocked: meta.blocked, reason: meta.reason }
                : undefined;
            }}
          />
          {startDateBlocked.blocked && (
            <div className="mt-2 rounded-[8px] bg-[#fee7e2] border border-[#f2704f] p-4 font-body text-base leading-6 text-neutral-900">
              {t(`wizard.event.dateBlocked`, {
                reason: startDateBlocked.reason ?? t(`wizard.event.dateBlockedFallback`),
              })}
            </div>
          )}
        </div>
      </section>

      <Separator />

      {/* Step 3: Address */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={3} title={t(`${k}.step4Title`)} />
          <AddressStep trip={trip} />
        </div>
      </section>

      <Separator />

      {/* Step 4: Options */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={4} title={t(`${k}.step5Title`)} />
          <div className="mt-8 lg:mt-4 lg:py-6 flex flex-col lg:flex-row gap-8 lg:gap-[72px]">
            <Toggle checked={cleaning} onChange={setCleaning} label={t(`${k}.step5Cleaning`)} />
          </div>
          <p className="mt-4 font-body text-base leading-6 text-neutral-600">
            {t(`${ek}.tariffNotice`)}
          </p>
          <SurchargeNotice
            title={t(`${ek}.surchargeTitle`)}
            rate={EMERGENCY_SURCHARGE_RATE}
            amount={surchargeAmount}
            total={totalPrice}
            tone="danger"
          />
        </div>
      </section>

      <Separator />

      {/* Step 5: Contacts */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={5} title={t(`${k}.step6Title`)} />
          <ContactsSection
            value={contacts}
            onChange={setContacts}
            errors={submitState.fieldErrors}
          />
        </div>
      </section>

      <Separator />

      <PriceSubmit
        price={totalPrice}
        disabled={submitState.buttonDisabled}
        disabledReason={
          startDateBlocked.blocked
            ? t(`wizard.event.dateBlockedShort`)
            : submitState.submitting
              ? t("payment.uploader.submitting")
              : submitState.submitError ?? submitState.validationError ?? undefined
        }
        onSubmit={submitState.submit}
      />

      <RentalFaq />
    </>
  );
}
