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
  QuantityStepper,
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

export default function EmergencyWizard({ stepOffset = 0 }: { stepOffset?: number } = {}) {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;
  const ek = "wizard.emergency" as const;

  const [selectedCabin, setSelectedCabin] = useState<CabinType>("standard");
  const [cabinQuantity, setCabinQuantity] = useState<number>(1);
  const [dateTime, setDateTime] = useState<DateTimeRangeValue>({
    startDate: null,
    endDate: null,
    startTime: "",
    endTime: "",
  });
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);
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
  // BUG-077: rental period must carry an explicit end date (ТЗ п.25+35).
  const endIso = dateTime.startDate
    ? toIsoDateTime(dateTime.endDate ?? dateTime.startDate, dateTime.endTime)
    : null;
  const windowExceeds90 = useMemo(() => {
    if (!dateTime.startDate || !dateTime.endDate) return false;
    const ms =
      dateTime.endDate.getTime() - dateTime.startDate.getTime();
    return ms > 90 * 24 * 60 * 60 * 1000;
  }, [dateTime.startDate, dateTime.endDate]);
  const firstLocation = trip.locations[0] ?? null;

  const previewPayload: RentalOrderPayload | null =
    cabinTypeId &&
    dateTime.endDate &&
    startIso &&
    endIso &&
    endIso > startIso &&
    !windowExceeds90 &&
    firstLocation
      ? {
          service_type: "rental_emergency",
          date_start: startIso,
          date_end: endIso,
          address_lat: firstLocation.lat,
          address_lon: firstLocation.lng,
          address_text: trip.items[0]?.text ?? "",
          logistics_type: "standard",
          payment_channel: contacts.contactType,
          items: [{ cabin_type: cabinTypeId, quantity: cabinQuantity }],
        }
      : null;

  const preview = useOrderPreview(previewPayload, previewRentalOrder);

  const fallbackSurcharge = Math.round(BASE_DAY_PRICE * EMERGENCY_SURCHARGE_RATE);
  // BUG-017: suppress the demo constant until the user has real inputs.
  const fallbackTotal = previewPayload ? BASE_DAY_PRICE + fallbackSurcharge : 0;
  const totalPrice = preview.data ? Number(preview.data.total) : fallbackTotal;
  const surchargeAmount = preview.data
    ? Math.round(Number(preview.data.total) * EMERGENCY_SURCHARGE_RATE / (1 + EMERGENCY_SURCHARGE_RATE))
    : fallbackSurcharge;

  const submitState = useOrderSubmit({
    contacts,
    canProceed:
      !startDateBlocked.blocked && !windowExceeds90 && !!previewPayload,
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
          <StepLabel step={1 + stepOffset} title={t(`${k}.step2Title`)} />
          <CabinSelector value={selectedCabin} onChange={setSelectedCabin} />
          <div className="mt-6 flex flex-col gap-2">
            <label className="font-body text-base lg:text-xl leading-6 text-neutral-600">
              {t(`${k}.step2QuantityLabel`)}
            </label>
            <QuantityStepper value={cabinQuantity} onChange={setCabinQuantity} min={1} />
            <p className="font-body text-sm leading-4 text-neutral-500">
              {t(`${k}.step2QuantityHint`)}
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 2: Period */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={2 + stepOffset} title={t(`${k}.step3Title`)} />
          <DateTimeRange
            value={dateTime}
            onChange={setDateTime}
            labels={{
              startDate: t(`${k}.step3StartDate`),
              endDate: t(`${k}.step3EndDate`),
              startTime: t(`${k}.step3StartTime`),
              endTime: t(`${k}.step3EndTime`),
            }}
            startCalendarOpen={startCalendarOpen}
            onToggleStartCalendar={() => setStartCalendarOpen((v) => !v)}
            endCalendarOpen={endCalendarOpen}
            onToggleEndCalendar={() => setEndCalendarOpen((v) => !v)}
            startTimeOpen={startTimeOpen}
            onToggleStartTime={() => setStartTimeOpen((v) => !v)}
            endTimeOpen={endTimeOpen}
            onToggleEndTime={() => setEndTimeOpen((v) => !v)}
            dayMeta={(d) => {
              const startOfDay = new Date(d);
              startOfDay.setHours(0, 0, 0, 0);
              const startOfToday = new Date();
              startOfToday.setHours(0, 0, 0, 0);
              if (startOfDay < startOfToday) return { disabled: true };
              const meta = availability.dayMap.get(dateKey(d));
              return meta
                ? { blocked: meta.blocked, reason: meta.reason }
                : undefined;
            }}
            endDayMeta={(d) => {
              const startOfDay = new Date(d);
              startOfDay.setHours(0, 0, 0, 0);
              if (dateTime.startDate) {
                const minEnd = new Date(dateTime.startDate);
                minEnd.setHours(0, 0, 0, 0);
                if (startOfDay < minEnd) return { disabled: true };
                const maxEnd = new Date(minEnd);
                maxEnd.setDate(maxEnd.getDate() + 90);
                if (startOfDay > maxEnd) return { disabled: true };
              } else {
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                if (startOfDay < startOfToday) return { disabled: true };
              }
              const meta = availability.dayMap.get(dateKey(d));
              return meta
                ? { blocked: meta.blocked, reason: meta.reason }
                : undefined;
            }}
          />
          {windowExceeds90 && (
            <div className="mt-2 rounded-[8px] bg-[#fee7e2] border border-[#f2704f] p-4 font-body text-base leading-6 text-neutral-900">
              {t(`${k}.step3WindowExceeds`, {
                defaultValue: "Срок аренды не может превышать 90 дней",
              })}
            </div>
          )}
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
          <StepLabel step={3 + stepOffset} title={t(`${k}.step4Title`)} />
          <AddressStep trip={trip} />
        </div>
      </section>

      <Separator />

      {/* Step 4: Options */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={4 + stepOffset} title={t(`${k}.step5Title`)} />
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
          <StepLabel step={5 + stepOffset} title={t(`${k}.step6Title`)} />
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
          windowExceeds90
            ? t(`${k}.step3WindowExceedsShort`, {
                defaultValue: "Период аренды > 90 дней",
              })
            : startDateBlocked.blocked
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
