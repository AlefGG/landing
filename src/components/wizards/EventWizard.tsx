import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAddressTrip } from "../../hooks/useAddressTrip";
import { useZones } from "../../hooks/useZones";
import { useTimeSlots } from "../../hooks/useTimeSlots";
import { useCabinTypes } from "../../hooks/useCabinTypes";
import { useOrderSubmit } from "../../hooks/useOrderSubmit";
import { useOrderPreview } from "../../hooks/useOrderPreview";
import { useRentalAvailability, dateKey } from "../../hooks/useAvailabilityCalendar";
import {
  createRentalOrder,
  previewRentalOrder,
  type RentalOrderPayload,
} from "../../services/orderService";
import {
  validateInstallDismantle,
  type InstallDismantleValue,
} from "../../utils/installDismantleValidator";
import { validateMultiCabin } from "../../utils/multiCabinValidator";
import RentalFaq from "../RentalFaq";
import {
  StepLabel,
  Separator,
  MultiCabinSelector,
  ContactsSection,
  PriceSubmit,
  Toggle,
  SurchargeNotice,
  EXPRESS_SURCHARGE_RATE,
  type CabinQuantityMap,
  type ContactsValue,
} from "./shared";
import InstallDismantleStep from "./shared/InstallDismantleStep";
import AddressStep from "./shared/AddressStep";
import { InlineError, FieldErrors } from "../ui";
import { saveDraft, loadDraft, clearDraft } from "../../services/wizardDraft";
import InlineOtpGate from "./shared/InlineOtpGate";

const DRAFT_SLUG = "event" as const;

type EventDraft = {
  cabinQuantities: Array<[number, number]>;
  installDismantle: InstallDismantleValue;
  installConsent: boolean;
  cleaning: boolean;
  expressMounting: boolean;
  contacts: ContactsValue;
};

export default function EventWizard({ stepOffset = 0 }: { stepOffset?: number } = {}) {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;
  const ek = "wizard.event" as const;

  // Draft hydration via useState initializers (runs once, no effects needed).
  // Trip items are NOT restored — useAddressTrip exposes no hydrate/replace API;
  // only internal setItems mutations are available.
  const [cabinQuantities, setCabinQuantities] = useState<CabinQuantityMap>(() => {
    const draft = loadDraft<EventDraft>(DRAFT_SLUG);
    return draft ? new Map(draft.cabinQuantities) : new Map();
  });
  const [installDismantle, setInstallDismantle] = useState<InstallDismantleValue>(() => {
    const draft = loadDraft<EventDraft>(DRAFT_SLUG);
    return draft?.installDismantle ?? {
      installDate: null,
      installSlotId: null,
      dismantleDate: null,
      dismantleSlotId: null,
    };
  });
  const [installConsent, setInstallConsent] = useState(() => {
    const draft = loadDraft<EventDraft>(DRAFT_SLUG);
    return draft?.installConsent ?? false;
  });
  const { slots, loading: slotsLoading } = useTimeSlots();
  const trip = useAddressTrip("rental");
  const { zones } = useZones("rental_event");
  const [cleaning, setCleaning] = useState(() => {
    const draft = loadDraft<EventDraft>(DRAFT_SLUG);
    return draft?.cleaning ?? true;
  });
  const [expressMounting, setExpressMounting] = useState(() => {
    const draft = loadDraft<EventDraft>(DRAFT_SLUG);
    return draft?.expressMounting ?? false;
  });
  const [contacts, setContacts] = useState<ContactsValue>(() => {
    const draft = loadDraft<EventDraft>(DRAFT_SLUG);
    return draft?.contacts ?? {
      contactType: "individual",
      name: "",
      phone: "",
      email: "",
    };
  });
  // Debounced save on every relevant state change.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveDraft<EventDraft>(DRAFT_SLUG, {
        cabinQuantities: Array.from(cabinQuantities.entries()),
        installDismantle,
        installConsent,
        cleaning,
        expressMounting,
        contacts,
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [cabinQuantities, installDismantle, installConsent, cleaning, expressMounting, contacts]);

  const { types: cabinTypes, loading: cabinTypesLoading } = useCabinTypes("rental");
  const cabinValidation = useMemo(
    () => validateMultiCabin(cabinQuantities, cabinTypes),
    [cabinQuantities, cabinTypes],
  );
  const firstCabinTypeId = cabinValidation.ok
    ? cabinValidation.payload[0]?.cabin_type ?? null
    : null;

  const availability = useRentalAvailability("rental_event", firstCabinTypeId);

  const validation = useMemo(
    () => validateInstallDismantle(installDismantle, slots, "rental_event"),
    [installDismantle, slots],
  );

  const firstLocation = trip.locations[0] ?? null;

  const previewPayload: RentalOrderPayload | null =
    cabinValidation.ok && validation.ok && firstLocation
      ? {
          service_type: "rental_event",
          install_date: validation.payload.install_date,
          install_slot: validation.payload.install_slot,
          dismantle_date: validation.payload.dismantle_date,
          dismantle_slot: validation.payload.dismantle_slot,
          address_lat: firstLocation.lat,
          address_lon: firstLocation.lng,
          address_text: trip.items[0]?.text ?? "",
          logistics_type: expressMounting ? "express" : "standard",
          payment_channel: contacts.contactType,
          items: cabinValidation.payload,
        }
      : null;

  const preview = useOrderPreview(previewPayload, previewRentalOrder);

  // F-015: do NOT show a hardcoded BASE_DAY_PRICE fallback — it misrepresented
  // the cost when the backend final differed from the heuristic. While
  // preview is in-flight, show 0; the submit button is gated on
  // `previewPayload` being valid, so the user can't submit on a 0.
  const totalPrice = preview.data ? Number(preview.data.total) : 0;
  const surchargeAmount = preview.data
    ? (preview.data.pricing_snapshot as { express_surcharge?: string })
        .express_surcharge
      ? Number(
          (preview.data.pricing_snapshot as { express_surcharge: string })
            .express_surcharge,
        )
      : 0
    : 0;

  const canProceed = !!previewPayload && installConsent;

  const mapServerField = useCallback((field: string): string | null => {
    if (field === "items") return "cabins";
    if (
      field === "install_date" ||
      field === "install_slot" ||
      field === "dismantle_date" ||
      field === "dismantle_slot" ||
      field === "date_start" ||
      field === "date_end"
    )
      return "installDismantle";
    if (field === "install_consent") return "installConsent";
    if (
      field === "address_lat" ||
      field === "address_lon" ||
      field === "address_text"
    )
      return "address";
    if (field === "logistics_type") return "logistics";
    if (field === "payment_channel") return "paymentChannel";
    return null;
  }, []);

  const submitState = useOrderSubmit({
    contacts,
    canProceed,
    mapServerField,
    buildOrder: async () => {
      if (!previewPayload) throw new Error("payload not ready");
      return createRentalOrder({ ...previewPayload, install_consent: true });
    },
    afterCreate: async () => {
      clearDraft(DRAFT_SLUG);
    },
    onPendingAuthChange: (pending) => {
      if (pending) {
        saveDraft<EventDraft>(DRAFT_SLUG, {
          cabinQuantities: Array.from(cabinQuantities.entries()),
          installDismantle,
          installConsent,
          cleaning,
          expressMounting,
          contacts,
        });
      }
    },
  });

  const validatorReason =
    !validation.ok && validation.reason !== "incomplete"
      ? validation.reason
      : null;

  return (
    <>
      {/* Step 1: Cabins */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={1 + stepOffset} title={t(`${k}.cabinSelector.title`)} />
          <MultiCabinSelector
            types={cabinTypes}
            loading={cabinTypesLoading}
            quantities={cabinQuantities}
            onChange={setCabinQuantities}
          />
        </div>
      </section>

      <Separator />

      {/* Step 2: Period (install + dismantle + consent) */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={2 + stepOffset} title={t(`${k}.step3Title`)} />
          <InstallDismantleStep
            value={installDismantle}
            onChange={setInstallDismantle}
            slots={slots}
            slotsLoading={slotsLoading}
            serviceType="rental_event"
            installDayMeta={(d) => {
              const startOfDay = new Date(d);
              startOfDay.setHours(0, 0, 0, 0);
              const minInstall = new Date();
              minInstall.setHours(0, 0, 0, 0);
              minInstall.setDate(minInstall.getDate() + 1);
              if (startOfDay < minInstall) return { disabled: true };
              const meta = availability.dayMap.get(dateKey(d));
              if (meta) {
                return {
                  blocked: meta.blocked,
                  reason:
                    meta.reason ??
                    (meta.blocked
                      ? t(`${k}.step3FleetFull`)
                      : null),
                };
              }
              return undefined;
            }}
            dismantleDayMeta={(d) => {
              const startOfDay = new Date(d);
              startOfDay.setHours(0, 0, 0, 0);
              if (installDismantle.installDate) {
                const min = new Date(installDismantle.installDate);
                min.setHours(0, 0, 0, 0);
                if (startOfDay < min) return { disabled: true };
                const max = new Date(min);
                max.setDate(max.getDate() + 90);
                if (startOfDay > max) return { disabled: true };
              } else {
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                if (startOfDay < startOfToday) return { disabled: true };
              }
              return undefined;
            }}
            consent={installConsent}
            onConsentChange={setInstallConsent}
          />
          {validatorReason && (
            <div className="mt-2 rounded-[8px] bg-[#fee7e2] border border-[#f2704f] p-4 font-body text-base leading-6 text-neutral-900">
              {t(`${k}.installValidator.${validatorReason}`)}
            </div>
          )}
        </div>
      </section>

      <Separator />

      {/* Step 3: Address */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div className="lg:px-[104px]">
          <StepLabel step={3 + stepOffset} title={t(`${k}.step4Title`)} />
          <AddressStep trip={trip} zones={zones} />
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
        disabled={submitState.buttonDisabled}
        disabledReason={
          !cabinValidation.ok && cabinValidation.reason === "noCabinTypes"
            ? t(`${k}.cabinSelector.noCabinTypes`)
            : !cabinValidation.ok && cabinValidation.reason === "noQuantitySelected"
              ? t(`${k}.cabinSelector.noQuantitySelected`)
              : validatorReason
                ? t(`${k}.installValidator.${validatorReason}`)
                : !installConsent
                  ? t(`${k}.installConsentRequired`)
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
