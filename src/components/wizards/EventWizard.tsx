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
  EXPRESS_SURCHARGE_RATE,
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

export default function EventWizard({ stepOffset = 0 }: { stepOffset?: number } = {}) {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;
  const ek = "wizard.event" as const;

  const [selectedCabin, setSelectedCabin] = useState<CabinType>("standard");
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
  const [expressMounting, setExpressMounting] = useState(false);
  const [contacts, setContacts] = useState<ContactsValue>({
    contactType: "individual",
    name: "",
    phone: "",
    email: "",
  });

  const { types: cabinTypes } = useCabinTypes("rental");
  const cabinTypeId = findCabinIdBySlug(cabinTypes, selectedCabin);

  const availability = useRentalAvailability("rental_event", cabinTypeId);
  const startDateBlocked = useMemo(() => {
    if (!dateTime.startDate) return { blocked: false, reason: null as string | null };
    const meta = availability.dayMap.get(dateKey(dateTime.startDate));
    return { blocked: meta?.blocked ?? false, reason: meta?.reason ?? null };
  }, [dateTime.startDate, availability.dayMap]);

  const under24h = useMemo(() => {
    if (!dateTime.startDate) return false;
    // BUG-035: warn as soon as the picked day alone is inside the 24h
    // window (before the user has filled startTime) — use the earliest
    // moment of the chosen day as the reference point.
    const dayStart = new Date(dateTime.startDate);
    dayStart.setHours(0, 0, 0, 0);
    const startMs = dateTime.startTime
      ? (() => {
          const [h, m] = dateTime.startTime.split(":").map(Number);
          const d = new Date(dateTime.startDate);
          d.setHours(h ?? 0, m ?? 0, 0, 0);
          return d.getTime();
        })()
      : dayStart.getTime();
    return startMs - Date.now() < 24 * 60 * 60 * 1000;
  }, [dateTime.startDate, dateTime.startTime]);

  const startIso = dateTime.startDate
    ? toIsoDateTime(dateTime.startDate, dateTime.startTime)
    : null;
  // BUG-077: rental period must carry an explicit end date (ТЗ п.25).
  // Fall back to startDate while user has not picked endDate yet so the
  // preview stays same-day; submit is gated on both being present below.
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
          service_type: "rental_event",
          date_start: startIso,
          date_end: endIso,
          address_lat: firstLocation.lat,
          address_lon: firstLocation.lng,
          address_text: trip.items[0]?.text ?? "",
          logistics_type: expressMounting ? "express" : "standard",
          payment_channel: contacts.contactType,
          items: [{ cabin_type: cabinTypeId, quantity: 1 }],
        }
      : null;

  const preview = useOrderPreview(previewPayload, previewRentalOrder);

  const fallbackSurcharge = expressMounting
    ? Math.round(BASE_DAY_PRICE * EXPRESS_SURCHARGE_RATE)
    : 0;
  // BUG-017: only fall back to the demo constant when the user has
  // *some* inputs (previewPayload is being built). With an empty form
  // display 0 — PriceSubmit turns that into «—».
  const fallbackTotal = previewPayload ? BASE_DAY_PRICE + fallbackSurcharge : 0;
  const totalPrice = preview.data ? Number(preview.data.total) : fallbackTotal;
  const surchargeAmount = preview.data
    ? (preview.data.pricing_snapshot as { express_surcharge?: string })
        .express_surcharge
      ? Number(
          (preview.data.pricing_snapshot as { express_surcharge: string })
            .express_surcharge,
        )
      : fallbackSurcharge
    : fallbackSurcharge;

  const canProceed =
    !under24h && !startDateBlocked.blocked && !windowExceeds90 && !!previewPayload;

  const submitState = useOrderSubmit({
    contacts,
    canProceed,
    buildOrder: async () => {
      if (!previewPayload) throw new Error("payload not ready");
      return createRentalOrder(previewPayload);
    },
  });

  return (
    <>
      {/* Step 1: Cabins */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={1 + stepOffset} title={t(`${k}.step2Title`)} />
          <CabinSelector value={selectedCabin} onChange={setSelectedCabin} />
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
              // BUG-037: disable past dates regardless of fleet availability
              // so users cannot pick a day the backend would reject.
              const startOfDay = new Date(d);
              startOfDay.setHours(0, 0, 0, 0);
              const startOfToday = new Date();
              startOfToday.setHours(0, 0, 0, 0);
              if (startOfDay < startOfToday) return { disabled: true };
              const meta = availability.dayMap.get(dateKey(d));
              if (meta) {
                // BUG-036: surface a tooltip reason for fleet-full days.
                return {
                  blocked: meta.blocked,
                  reason:
                    meta.reason ??
                    (meta.blocked
                      ? t(`${k}.step3FleetFull`, {
                          defaultValue: "Нет свободных кабин",
                        })
                      : null),
                };
              }
              return undefined;
            }}
            endDayMeta={(d) => {
              // BUG-077: end date must be >= startDate and within 90-day
              // window (backend RENTAL_MAX_WINDOW_DAYS).
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
              if (meta) {
                return {
                  blocked: meta.blocked,
                  reason:
                    meta.reason ??
                    (meta.blocked
                      ? t(`${k}.step3FleetFull`, {
                          defaultValue: "Нет свободных кабин",
                        })
                      : null),
                };
              }
              return undefined;
            }}
          />
          {under24h && (
            <div className="mt-2 rounded-[8px] bg-[#fff7de] border border-[#f2bc70] p-4 font-body text-base leading-6 text-neutral-900">
              {t(`${ek}.under24hWarning`)}
            </div>
          )}
          {windowExceeds90 && (
            <div className="mt-2 rounded-[8px] bg-[#fee7e2] border border-[#f2704f] p-4 font-body text-base leading-6 text-neutral-900">
              {t(`${k}.step3WindowExceeds`, {
                defaultValue: "Срок аренды не может превышать 90 дней",
              })}
            </div>
          )}
          {startDateBlocked.blocked && (
            <div className="mt-2 rounded-[8px] bg-[#fee7e2] border border-[#f2704f] p-4 font-body text-base leading-6 text-neutral-900">
              {t(`${ek}.dateBlocked`, {
                reason: startDateBlocked.reason ?? t(`${ek}.dateBlockedFallback`),
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
            <Toggle
              checked={expressMounting}
              onChange={setExpressMounting}
              label={t(`${k}.step5ExpressMounting`)}
            />
          </div>
          {expressMounting && (
            <>
              <SurchargeNotice
                title={t(`${ek}.expressSurchargeTitle`)}
                rate={EXPRESS_SURCHARGE_RATE}
                amount={surchargeAmount}
                total={totalPrice}
              />
              <p className="mt-4 font-body text-base leading-6 text-neutral-600">
                {t(`${ek}.installNotice`)}
              </p>
            </>
          )}
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
          under24h
            ? t(`${ek}.under24hBlock`)
            : windowExceeds90
              ? t(`${k}.step3WindowExceedsShort`, {
                  defaultValue: "Период аренды > 90 дней",
                })
              : startDateBlocked.blocked
              ? t(`${ek}.dateBlockedShort`)
              : submitState.submitting
                ? t("payment.uploader.submitting")
                : submitState.submitError ??
                  submitState.validationError ??
                  undefined
        }
        onSubmit={submitState.submit}
      />

      <RentalFaq />
    </>
  );
}
