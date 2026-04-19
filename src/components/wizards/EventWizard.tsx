import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAddressTrip } from "../../hooks/useAddressTrip";
import { useCabinTypes, findCabinIdBySlug } from "../../hooks/useCabinTypes";
import { useOrderSubmit } from "../../hooks/useOrderSubmit";
import { useOrderPreview } from "../../hooks/useOrderPreview";
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

export default function EventWizard() {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;
  const ek = "wizard.event" as const;

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
  const [expressMounting, setExpressMounting] = useState(false);
  const [contacts, setContacts] = useState<ContactsValue>({
    contactType: "individual",
    name: "",
    phone: "",
    email: "",
  });

  const { types: cabinTypes } = useCabinTypes("rental");
  const cabinTypeId = findCabinIdBySlug(cabinTypes, selectedCabin);

  const under24h = useMemo(() => {
    if (!dateTime.startDate || !dateTime.startTime) return false;
    const [h, m] = dateTime.startTime.split(":").map(Number);
    const startMs = new Date(dateTime.startDate).setHours(h ?? 0, m ?? 0, 0, 0);
    return startMs - Date.now() < 24 * 60 * 60 * 1000;
  }, [dateTime.startDate, dateTime.startTime]);

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
  const fallbackTotal = BASE_DAY_PRICE + fallbackSurcharge;
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

  const canProceed = !under24h && !!previewPayload;

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
          />
          {under24h && (
            <div className="mt-2 rounded-[8px] bg-[#fff7de] border border-[#f2bc70] p-4 font-body text-base leading-6 text-neutral-900">
              {t(`${ek}.under24hWarning`)}
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
          under24h
            ? t(`${ek}.under24hBlock`)
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
