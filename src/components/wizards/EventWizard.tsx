import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAddressTrip } from "../../hooks/useAddressTrip";
import { useWizardSubmit } from "../../hooks/useWizardSubmit";
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
  const trip = useAddressTrip();
  const [cleaning, setCleaning] = useState(true);
  const [expressMounting, setExpressMounting] = useState(false);
  const [contacts, setContacts] = useState<ContactsValue>({
    contactType: "individual",
    name: "",
    phone: "",
    email: "",
  });

  const under24h = useMemo(() => {
    if (!dateTime.startDate || !dateTime.startTime) return false;
    const [h, m] = dateTime.startTime.split(":").map(Number);
    const startMs = new Date(dateTime.startDate).setHours(h ?? 0, m ?? 0, 0, 0);
    return startMs - Date.now() < 24 * 60 * 60 * 1000;
  }, [dateTime.startDate, dateTime.startTime]);

  const surchargeAmount = expressMounting
    ? Math.round(BASE_DAY_PRICE * EXPRESS_SURCHARGE_RATE)
    : 0;
  const totalPrice = BASE_DAY_PRICE + surchargeAmount;

  const wizardSubmit = useWizardSubmit(
    {
      service: "rental",
      source: "event-wizard",
      amount: totalPrice,
      contacts,
    },
    under24h,
  );

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
          <ContactsSection value={contacts} onChange={setContacts} />
        </div>
      </section>

      <Separator />

      <PriceSubmit
        price={totalPrice}
        disabled={wizardSubmit.buttonDisabled}
        disabledReason={
          under24h
            ? t(`${ek}.under24hBlock`)
            : wizardSubmit.submitting
              ? t("payment.uploader.submitting")
              : wizardSubmit.validationError ?? undefined
        }
        onSubmit={wizardSubmit.submit}
      />

      <RentalFaq />
    </>
  );
}
