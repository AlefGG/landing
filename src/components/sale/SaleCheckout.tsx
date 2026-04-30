import { lazy, Suspense, useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Seo from "../Seo";
import ResponsiveImage from "../ResponsiveImage";
import { StepHeader, InlineError, FieldErrors } from "../ui";

const MapPicker = lazy(() => import("../ui/MapPicker"));
import AddressAutocomplete from "../ui/AddressAutocomplete";
import ContactsSection, {
  type ContactsValue,
} from "../wizards/shared/ContactsSection";
import PriceSubmit from "../wizards/shared/PriceSubmit";
import Separator from "../wizards/shared/Separator";
import { useAddressTrip } from "../../hooks/useAddressTrip";
import { useZones } from "../../hooks/useZones";
import { deliveryLabel } from "../../utils/deliveryLabel";
import { useOrderSubmit } from "../../hooks/useOrderSubmit";
import { useOrderPreview } from "../../hooks/useOrderPreview";
import { reverseGeocode } from "../../services/geocoderService";
import {
  createSaleOrder,
  previewSaleOrder,
  type SaleOrderPayload,
} from "../../services/orderService";
import type { SaleItem } from "../../services/catalogService";
import { saveDraft, loadDraft, clearDraft } from "../../services/wizardDraft";
import InlineOtpGate from "../wizards/shared/InlineOtpGate";

const DRAFT_SLUG = "sale-checkout" as const;

type SaleCheckoutDraft = {
  count: number;
  contacts: ContactsValue;
};

function Stepper({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center gap-2 w-[160px]">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="shrink-0 size-8 rounded-full bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to flex items-center justify-center text-white"
        aria-label="Уменьшить"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <input
        type="number"
        value={value}
        aria-label="Количество"
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n) && n >= min) onChange(n);
        }}
        className="h-10 flex-1 min-w-0 rounded-[8px] border border-neutral-400 bg-white px-2 text-center font-body text-xl text-neutral-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="shrink-0 size-8 rounded-full bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to flex items-center justify-center text-white"
        aria-label="Увеличить"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export default function SaleCheckout({ item }: { item: SaleItem }) {
  const { t } = useTranslation();

  const name = item.name;
  const description = item.description;

  // Draft hydration via useState initializers (runs once, no effects needed).
  // Trip items (delivery address) are NOT restored — useAddressTrip exposes no
  // hydrate/replace API; only internal setItems mutations are available.
  const [count, setCount] = useState(() => {
    const draft = loadDraft<SaleCheckoutDraft>(DRAFT_SLUG);
    return draft?.count ?? 1;
  });
  const [contacts, setContacts] = useState<ContactsValue>(() => {
    const draft = loadDraft<SaleCheckoutDraft>(DRAFT_SLUG);
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
      saveDraft<SaleCheckoutDraft>(DRAFT_SLUG, { count, contacts });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [count, contacts]);

  // BUG-044: reuse rental/sanitation address+map+OSRM stack so buyers see the
  // delivery destination pin and the live distance that drives delivery_fee.
  const trip = useAddressTrip("sale");
  const { zones } = useZones("sale");
  const entry = trip.items[0];
  const addressText = entry?.text ?? "";
  const firstLocation = trip.locations[0] ?? null;

  const itemsTotal = item.price * count;

  const addressValid = addressText.trim().length >= 3 && firstLocation !== null;

  const payload: SaleOrderPayload | null = addressValid && firstLocation && entry
    ? {
        address_lat: firstLocation.lat,
        address_lon: firstLocation.lng,
        address_text: entry.text,
        payment_channel: contacts.contactType,
        items: [{ equipment_id: Number(item.id), quantity: count }],
      }
    : null;

  const preview = useOrderPreview(payload, previewSaleOrder);
  const total = preview.data ? Number(preview.data.total) : itemsTotal;
  const deliveryFee = total - itemsTotal;

  const mapServerField = useCallback((field: string): string | null => {
    if (field === "items") return "items";
    if (
      field === "address_lat" ||
      field === "address_lon" ||
      field === "address_text"
    )
      return "address";
    if (field === "payment_channel") return "paymentChannel";
    return null;
  }, []);

  const submitState = useOrderSubmit({
    contacts,
    canProceed: item.inStock && count >= 1 && addressValid,
    mapServerField,
    buildOrder: async () => {
      if (!payload) throw new Error("payload not ready");
      return createSaleOrder(payload);
    },
    afterCreate: async () => {
      clearDraft(DRAFT_SLUG);
    },
    onPendingAuthChange: (pending) => {
      if (pending) {
        saveDraft<SaleCheckoutDraft>(DRAFT_SLUG, { count, contacts });
      }
    },
  });

  const disabledReason = !item.inStock
    ? t("catalog.sale.checkout.errors.outOfStock")
    : submitState.submitting
      ? t("catalog.sale.checkout.submitting")
      : submitState.validationError ?? undefined;

  const title = t("catalog.sale.checkout.title");

  return (
    <div className="bg-white overflow-x-clip">
      <Seo
        pageKey="sale"
        titleOverride={`${name} — ${title} — ${t("meta.brandName")}`}
        descriptionOverride={description}
      />

      {/* Hero with 4-level breadcrumb */}
      <section className="relative h-[104px] lg:h-[176px]">
        <div
          className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-[1216px] h-[712px] pointer-events-none"
          style={{ top: "-64px" }}
          aria-hidden="true"
        >
          <img src="/assets/images/wizard-hero-shape.svg" alt="" className="w-full h-full" />
        </div>
        <div
          className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#f1f1f1] to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-[1216px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-0.5 text-xs font-body mb-2 lg:mb-8">
            <Link to="/" className="text-[#1F5F8F] underline leading-4 text-xs px-[10px] py-[8px]">
              {t("wizard.rental.breadcrumbHome")}
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-neutral-500" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Link to="/sale" className="text-[#1F5F8F] underline leading-4 text-xs px-[10px] py-[8px]">
              {t("catalog.sale.backToCatalog")}
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-neutral-500" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Link to={`/sale/${item.id}`} className="text-[#1F5F8F] underline leading-4 text-xs px-[10px] py-[8px]">
              {name}
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-neutral-500" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-neutral-500 leading-4 text-xs px-[10px] py-[8px]">
              {t("catalog.sale.checkout.breadcrumb")}
            </span>
          </nav>

          <h1 className="font-heading text-[32px] lg:text-[56px] font-extrabold leading-[32px] lg:leading-[56px] text-cta-main">
            {title}
          </h1>
        </div>

        <p
          className="hidden lg:block absolute right-[230px] top-[100px] font-heading text-[144px] font-extrabold leading-[56px] pointer-events-none select-none"
          style={{
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(89, 176, 2, 0.15)",
          }}
          aria-hidden="true"
        >
          {title}
        </p>
      </section>

      {/* Summary */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
          <div className="size-[120px] shrink-0 flex items-center justify-center bg-white rounded-2xl">
            <ResponsiveImage
              src={item.image}
              alt={name}
              sizes="120px"
              className="h-[120px] w-[120px] object-contain"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <h2 className="font-heading text-xl lg:text-2xl font-extrabold leading-7 text-neutral-900">
              {name}
            </h2>
            <p className="font-body text-base leading-6 text-neutral-600">
              {description}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-body text-sm leading-4 text-neutral-600">
              {t("catalog.sale.checkout.summaryCount")}
            </span>
            <Stepper value={count} onChange={setCount} min={1} />
          </div>
          <div className="flex flex-col gap-2 lg:items-end">
            <span className="font-body text-sm leading-4 text-neutral-600">
              {t("catalog.sale.checkout.summaryTotal")}
            </span>
            <span className="font-body font-semibold text-2xl leading-8 text-cta-main whitespace-nowrap">
              {total.toLocaleString("ru-RU")} {t("wizard.rental.currency")}
            </span>
            {deliveryFee > 0 && (
              <div className="flex flex-col items-end gap-0.5">
                {trip.legs[0]?.preview && (
                  <span className="font-body text-sm leading-4 text-neutral-700">
                    {deliveryLabel(trip.legs[0].preview, t)}
                  </span>
                )}
                <span className="font-body text-sm leading-4 text-neutral-500 whitespace-nowrap">
                  {t("catalog.sale.checkout.summaryDelivery", {
                    defaultValue: "в т.ч. доставка {{amount}} ₸",
                    amount: deliveryFee.toLocaleString("ru-RU"),
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Address — ТЗ §3.7 / BUG-015: buyer must provide delivery address */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <StepHeader
          step={1}
          title={t("catalog.sale.checkout.addressStep", {
            defaultValue: "Адрес доставки",
          })}
        />
        <div className="mt-4 flex flex-col gap-2">
          <AddressAutocomplete
            value={addressText}
            onChange={(v) => {
              if (entry) trip.setText(entry.id, v);
            }}
            onSelect={(r) => {
              if (!entry) return;
              trip.setText(entry.id, r.displayName);
              trip.setLocation(entry.id, { lat: r.lat, lng: r.lng });
            }}
            placeholder={t("catalog.sale.checkout.addressPlaceholder", {
              defaultValue: "г. Алматы, ул. ...",
            })}
            className="max-w-full lg:max-w-[488px]"
          />
          <Suspense
            fallback={
              <div className="mt-0 h-[374px] lg:h-[450px] bg-neutral-100 animate-pulse rounded-[12px]" />
            }
          >
            <MapPicker
              points={trip.locations}
              onMapClick={async (p) => {
                const name = await reverseGeocode(p.lat, p.lng);
                if (!entry) return;
                trip.setText(
                  entry.id,
                  name ?? `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`,
                );
                trip.setLocation(entry.id, p);
              }}
              routes={trip.routes}
              warehouse={trip.warehouse ? { lat: trip.warehouse.lat, lng: trip.warehouse.lon } : null}
              loading={trip.loading}
              loadingText={t("wizard.service.step2RouteLoading", {
                defaultValue: "Считаем маршрут…",
              })}
              className="mt-0 h-[374px] lg:h-[450px]"
              zones={zones}
            />
          </Suspense>
          {!trip.loading && trip.error && (
            <div className="mt-2 font-body text-base text-red-600">
              {t("wizard.service.step2RouteError", {
                defaultValue: "Не удалось построить маршрут",
              })}
            </div>
          )}
          {!trip.loading && !trip.error && trip.hasPreview && (
            <div className="mt-2 flex flex-col lg:flex-row gap-2 lg:gap-6 font-body text-base text-neutral-900">
              <span>
                {t("wizard.service.step2Distance", { defaultValue: "Дистанция" })}:{" "}
                <strong>
                  {trip.distanceKm.toFixed(1)}{" "}
                  {t("wizard.service.step2Km", { defaultValue: "км" })}
                </strong>
              </span>
              <span>
                {t("wizard.service.step2DeliveryCost", { defaultValue: "Доставка" })}:{" "}
                <strong className="text-cta-main">
                  {trip.deliveryCost.toLocaleString("ru-RU")} ₸
                </strong>
              </span>
            </div>
          )}
          {submitState.attempted && !addressValid && (
            <p className="mt-2 font-body text-sm text-red-600">
              {t("catalog.sale.checkout.addressRequired", {
                defaultValue: "Укажите адрес доставки",
              })}
            </p>
          )}
        </div>
      </section>

      <Separator />

      {/* Contacts */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <StepHeader step={2} title={t("catalog.sale.checkout.contactsStep")} />
        <ContactsSection
          value={contacts}
          onChange={setContacts}
          errors={submitState.fieldErrors}
        />
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
        price={total}
        disabled={submitState.buttonDisabled}
        disabledReason={disabledReason}
        onSubmit={submitState.submit}
      />

      {submitState.pendingAuth && (
        <InlineOtpGate
          phone={contacts.phone}
          onSuccess={() => {
            // useOrderSubmit auto-runs buildOrder via authStatus useEffect
          }}
          onChangePhone={submitState.cancelPendingAuth}
        />
      )}
    </div>
  );
}
