import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAddressTrip } from "../../hooks/useAddressTrip";
import { useWizardSubmit } from "../../hooks/useWizardSubmit";
import RentalFaq from "../RentalFaq";
import { Select } from "../ui";
import {
  StepLabel,
  Separator,
  ContactsSection,
  PriceSubmit,
  ConstructionDiscountTable,
  constructionCabins,
  getConstructionDiscount,
  BASE_DAY_PRICE,
  CONSTRUCTION_DISCOUNTS,
  type ContactsValue,
} from "./shared";
import AddressStep from "./shared/AddressStep";

const MONTH_OPTIONS = CONSTRUCTION_DISCOUNTS.map((r) => r.months);

export default function ConstructionWizard() {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;
  const ck = "wizard.construction" as const;

  const [months, setMonths] = useState<number>(1);
  const trip = useAddressTrip();
  const [contacts, setContacts] = useState<ContactsValue>({
    contactType: "legal",
    name: "",
    phone: "",
    email: "",
  });

  const cabin = constructionCabins[0]!;

  const discount = getConstructionDiscount(months);
  const monthlyPriceApprox = BASE_DAY_PRICE * 30;
  const totalPrice = Math.round(monthlyPriceApprox * months * (1 - discount));

  const wizardSubmit = useWizardSubmit({
    service: "rental",
    source: "construction-wizard",
    amount: totalPrice,
    contacts,
  });

  return (
    <>
      {/* Step 1: Cabin (read-only) */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={1} title={t(`${k}.step2Title`)} />
          <div className="mt-4 py-4 flex items-center lg:flex-col gap-6 w-full lg:w-[288px] mx-auto px-0 lg:px-10 lg:py-4 rounded-3xl bg-white">
            <img
              src={cabin.image}
              alt={t(`${ck}.cabinName`)}
              className="h-[98px] lg:h-[200px] w-auto object-contain shrink-0"
            />
            <div className="flex flex-col gap-1">
              <span className="font-body text-xl leading-6 text-neutral-900">
                {t(`${ck}.cabinName`)}
              </span>
              <span className="font-body text-sm leading-4 text-neutral-500">
                {t(`${ck}.cabinHint`)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 2: Rental period (months) */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={2} title={t(`${ck}.periodTitle`)} />
          <div className="mt-4 py-4 flex flex-col gap-2 w-full lg:w-[280px]">
            <label className="font-body text-base leading-6 text-neutral-600">
              {t(`${ck}.periodLabel`)}
            </label>
            <Select
              value={String(months)}
              onChange={(v) => setMonths(Number(v))}
              options={MONTH_OPTIONS.map((m) => ({
                value: String(m),
                label: t(`${ck}.monthsValue`, { count: m }),
              }))}
            />
            <p className="font-body text-sm leading-4 text-neutral-500">
              {t(`${ck}.discountHint`)}
            </p>
          </div>
          <div className="mt-6 max-w-[480px]">
            <h3 className="font-body font-semibold text-base leading-6 text-neutral-900">
              {t(`${ck}.discountTable.title`)}
            </h3>
            <ConstructionDiscountTable selectedMonths={months} onSelect={setMonths} />
            {discount > 0 && (
              <p className="mt-2 font-body text-sm leading-4 text-cta-main">
                {t(`${ck}.discountTable.selectedNote`, {
                  months: t(`${ck}.monthsValue`, { count: months }),
                  percent: Math.round(discount * 100),
                })}
              </p>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 3: Multi-address */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={3} title={t(`${ck}.addressTitle`)} />
          <p className="mt-2 font-body text-base leading-6 text-neutral-600">
            {t(`${ck}.multiAddressHint`)}
          </p>
          <AddressStep trip={trip} />
        </div>
      </section>

      <Separator />

      {/* Step 4: Contacts */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={4} title={t(`${k}.step6Title`)} />
          <ContactsSection value={contacts} onChange={setContacts} />
        </div>
      </section>

      <Separator />

      <PriceSubmit
        price={totalPrice}
        disabled={wizardSubmit.buttonDisabled}
        disabledReason={
          wizardSubmit.submitting
            ? t("payment.uploader.submitting")
            : wizardSubmit.validationError ?? undefined
        }
        onSubmit={wizardSubmit.submit}
      />

      <RentalFaq />
    </>
  );
}
