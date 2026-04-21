import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAddressTrip } from "../../hooks/useAddressTrip";
import { useOrderSubmit } from "../../hooks/useOrderSubmit";
import { useOrderPreview } from "../../hooks/useOrderPreview";
import { useCabinTypes } from "../../hooks/useCabinTypes";
import { useRentalAvailability, dateKey } from "../../hooks/useAvailabilityCalendar";
import {
  createConstructionOrder,
  previewConstructionOrder,
  type ConstructionOrderPayload,
} from "../../services/orderService";
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

export default function ConstructionWizard({ stepOffset = 0 }: { stepOffset?: number } = {}) {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;
  const ck = "wizard.construction" as const;

  const [months, setMonths] = useState<number>(1);
  const trip = useAddressTrip("construction");
  const [contacts, setContacts] = useState<ContactsValue>({
    // BUG-055: default to individual — payment_channel must mirror an
    // explicit Физлицо/Юрлицо click, not a hard-coded default.
    contactType: "individual",
    name: "",
    phone: "",
    email: "",
  });

  const cabin = constructionCabins[0]!;

  const { types: constructionCabinTypes } = useCabinTypes("construction");
  const constructionCabinId = constructionCabinTypes?.[0]?.id ?? null;
  const availability = useRentalAvailability("rental_construction", constructionCabinId);
  const startDateMeta = useMemo(() => {
    const meta = availability.dayMap.get(dateKey(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
    return meta ?? null;
  }, [availability.dayMap]);

  const discount = getConstructionDiscount(months);
  const monthlyPriceApprox = BASE_DAY_PRICE * 30;

  const addressesPayload = trip.items
    .map((item) => {
      if (!item.location) return null;
      return {
        address_text: item.text || "",
        lat: item.location.lat,
        lon: item.location.lng,
        quantity: 1,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Start date — first day next week to satisfy start_date in future.
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7);
  startDate.setHours(10, 0, 0, 0);

  const previewPayload: ConstructionOrderPayload | null =
    addressesPayload.length > 0
      ? {
          months,
          start_date: startDate.toISOString(),
          logistics_type: "standard",
          payment_channel: contacts.contactType,
          addresses: addressesPayload,
        }
      : null;

  const preview = useOrderPreview(previewPayload, previewConstructionOrder);
  // BUG-017: only fall back to a heuristic total when the user has already
  // started the wizard; otherwise show 0 so the widget doesn't lie.
  const fallbackTotal = previewPayload
    ? Math.round(monthlyPriceApprox * months * (1 - discount))
    : 0;
  const totalPrice = preview.data ? Number(preview.data.total) : fallbackTotal;

  const submitState = useOrderSubmit({
    contacts,
    canProceed: !!previewPayload && !(startDateMeta?.blocked ?? false),
    buildOrder: async () => {
      if (!previewPayload) throw new Error("payload not ready");
      return createConstructionOrder(previewPayload);
    },
  });

  return (
    <>
      {/* Step 1: Cabin (read-only) */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={1 + stepOffset} title={t(`${k}.step2Title`)} />
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
          <StepLabel step={2 + stepOffset} title={t(`${ck}.periodTitle`)} />
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
            {startDateMeta?.blocked && (
              <div className="mt-4 rounded-[8px] bg-[#fee7e2] border border-[#f2704f] p-4 font-body text-base leading-6 text-neutral-900">
                {t(`wizard.event.dateBlocked`, {
                  reason: startDateMeta.reason ?? t(`wizard.event.dateBlockedFallback`),
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Step 3: Multi-address */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={3 + stepOffset} title={t(`${ck}.addressTitle`)} />
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
          <StepLabel step={4 + stepOffset} title={t(`${k}.step6Title`)} />
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
          startDateMeta?.blocked
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
