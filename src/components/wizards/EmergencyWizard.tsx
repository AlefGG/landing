import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAddressTrip } from "../../hooks/useAddressTrip";
import RentalFaq from "../RentalFaq";
import {
  StepLabel,
  Separator,
  CabinSelector,
  ContactsSection,
  PriceSubmit,
  Toggle,
  type CabinType,
  type ContactsValue,
} from "./shared";
import DateTimeRange, { type DateTimeRangeValue } from "./shared/DateTimeRange";
import AddressStep from "./shared/AddressStep";

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
  const trip = useAddressTrip();
  const [cleaning, setCleaning] = useState(true);
  const [contacts, setContacts] = useState<ContactsValue>({
    contactType: "individual",
    name: "",
    phone: "",
    email: "",
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
          />
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

      <PriceSubmit price={125000} />

      <RentalFaq />
    </>
  );
}
