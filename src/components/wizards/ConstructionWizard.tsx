import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAddressTrip } from "../../hooks/useAddressTrip";
import { useZones } from "../../hooks/useZones";
import { useCabinTypes } from "../../hooks/useCabinTypes";
import { useRentalAvailability, dateKey } from "../../hooks/useAvailabilityCalendar";
import {
  createConstructionOrder,
  previewConstructionOrder,
  type ConstructionOrderPayload,
} from "../../services/orderService";
import RentalFaq from "../RentalFaq";
import ResponsiveImage from "../ResponsiveImage";
import { Select, InlineError, FieldErrors } from "../ui";
import { computeDiscountDisplay } from "../../utils/discountDisplay";
import {
  StepLabel,
  Separator,
  ContactsSection,
  PriceSubmit,
  ConstructionDiscountTable,
  constructionCabins,
  BASE_DAY_PRICE,
  useWizardDraft,
  useRentalSubmit,
  constructionServerFieldMap,
  type ContactsValue,
} from "./shared";
import { useConstructionDiscounts } from "../../hooks/useConstructionDiscounts";
import AddressStep from "./shared/AddressStep";
import InlineOtpGate from "./shared/InlineOtpGate";

const DRAFT_SLUG = "construction" as const;

type ConstructionDraft = {
  months: number;
  contacts: ContactsValue;
};

const DRAFT_DEFAULTS: ConstructionDraft = {
  months: 1,
  // BUG-055: default to individual — payment_channel must mirror an
  // explicit Физлицо/Юрлицо click, not a hard-coded default.
  contacts: {
    contactType: "individual",
    name: "",
    phone: "",
    email: "",
  },
};

export default function ConstructionWizard({ stepOffset = 0 }: { stepOffset?: number } = {}) {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;
  const ck = "wizard.construction" as const;

  const { draft, setDraft } = useWizardDraft<ConstructionDraft>(DRAFT_SLUG, DRAFT_DEFAULTS);
  const { months, contacts } = draft;
  const setMonths = useCallback(
    (next: number) => setDraft((d) => ({ ...d, months: next })),
    [setDraft],
  );
  const setContacts = useCallback(
    (next: ContactsValue) => setDraft((d) => ({ ...d, contacts: next })),
    [setDraft],
  );

  const trip = useAddressTrip("construction");
  const { zones } = useZones("rental_construction");

  const cabin = constructionCabins[0]!;

  const { types: constructionCabinTypes } = useCabinTypes("construction");
  const constructionCabinId = constructionCabinTypes?.[0]?.id ?? null;
  const availability = useRentalAvailability("rental_construction", constructionCabinId);

  // FE-CQ-002: anchor the start date at mount via useState initializer so
  // the value is stable for the component lifetime. The previous code
  // recomputed `Date.now() + 7 * day` inside a useMemo factory on every
  // render, which is impure and made `availability.dayMap.get(...)` return
  // mismatched meta when other deps changed mid-session. Same anchor is
  // reused for previewPayload.start_date so preview cache stays warm.
  const [startDateAnchor] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(10, 0, 0, 0);
    return d;
  });
  const startDateMeta = useMemo(
    () => availability.dayMap.get(dateKey(startDateAnchor)) ?? null,
    [availability.dayMap, startDateAnchor],
  );

  // F-010: discount tiers come from the backend so the admin can change
  // them without a frontend release. Hook returns the static fallback if
  // the fetch fails or the company has no RentalDiscount rows seeded.
  const { discounts: discountTiers } = useConstructionDiscounts();
  const discount =
    discountTiers.find((r) => r.months === months)?.discount ?? 0;
  const monthOptions = discountTiers.map((r) => r.months);
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

  const previewPayload: ConstructionOrderPayload | null =
    addressesPayload.length > 0
      ? {
          months,
          start_date: startDateAnchor.toISOString(),
          logistics_type: "standard",
          payment_channel: contacts.contactType,
          addresses: addressesPayload,
        }
      : null;

  const canProceed = !!previewPayload && !(startDateMeta?.blocked ?? false);

  const { preview, submitState } = useRentalSubmit({
    draftSlug: DRAFT_SLUG,
    contacts,
    canProceed,
    previewPayload,
    previewer: previewConstructionOrder,
    createOrder: async () => {
      if (!previewPayload) throw new Error("payload not ready");
      return createConstructionOrder(previewPayload);
    },
    mapServerField: constructionServerFieldMap,
    draftSnapshot: () => draft,
  });

  // BUG-017: only fall back to a heuristic total when the user has already
  // started the wizard; otherwise show 0 so the widget doesn't lie.
  const fallbackTotal = previewPayload
    ? Math.round(monthlyPriceApprox * months * (1 - discount))
    : 0;
  const totalPrice = preview.data ? Number(preview.data.total) : fallbackTotal;

  // Discount display: prefer server-computed fields (PR-4) when available;
  // fall back to local heuristic for the public/anonymous landing flow
  // where construction preview is auth-gated and `preview.data` stays null.
  // Heuristic mirrors fallbackTotal — same approximation, same trade-off.
  const serverDiscount = computeDiscountDisplay(preview.data ?? null);
  const localPriceBefore = previewPayload && discount > 0
    ? Math.round(monthlyPriceApprox * months)
    : undefined;
  const localPercent = previewPayload && discount > 0
    ? Math.round(discount * 100)
    : undefined;
  const priceBefore = serverDiscount?.priceBefore ?? localPriceBefore;
  const discountPercent = serverDiscount?.percent ?? localPercent;

  return (
    <>
      {/* Step 1: Cabin (read-only) */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={1 + stepOffset} title={t(`${k}.step2Title`)} />
          <div className="mt-4 py-4 flex items-center lg:flex-col gap-6 w-full lg:w-[288px] mx-auto px-0 lg:px-10 lg:py-4 rounded-3xl bg-white">
            <ResponsiveImage
              src={cabin.image}
              alt={t(`${ck}.cabinName`)}
              sizes="(max-width:768px) 100vw, 288px"
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
              options={monthOptions.map((m) => ({
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
            <ConstructionDiscountTable
              selectedMonths={months}
              onSelect={setMonths}
              rows={discountTiers}
            />
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
          <AddressStep trip={trip} zones={zones} />
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

      {submitState.submitError && (
        <div className="max-w-[1216px] mx-auto px-4 lg:px-8 mt-3 space-y-2 lg:px-[104px]">
          <InlineError
            error={submitState.submitError}
            overrideKey="errors.orderCreate"
          />
          {Object.keys(submitState.unknownFieldErrors).length > 0 && (
            <FieldErrors
              fieldErrors={submitState.unknownFieldErrors}
              knownFields={[]}
            />
          )}
        </div>
      )}

      <PriceSubmit
        price={totalPrice}
        priceBefore={priceBefore}
        discountPercent={discountPercent}
        disabled={submitState.buttonDisabled}
        disabledReason={
          startDateMeta?.blocked
            ? t(`wizard.event.dateBlockedShort`)
            : submitState.submitting
              ? t("payment.uploader.submitting")
              : submitState.validationError ?? undefined
        }
        onSubmit={submitState.submit}
      />

      <RentalFaq />

      {submitState.pendingAuth && (
        <InlineOtpGate
          phone={contacts.phone}
          onSuccess={() => {
            // useOrderSubmit auto-runs buildOrder via authStatus useEffect
          }}
          onChangePhone={submitState.cancelPendingAuth}
        />
      )}
    </>
  );
}
