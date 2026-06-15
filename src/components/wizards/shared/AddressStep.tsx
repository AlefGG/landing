import { lazy, Suspense, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AddressList } from "../../ui";
import type { useAddressTrip } from "../../../hooks/useAddressTrip";

const MapPicker = lazy(() => import("../../ui/MapPicker"));
import type { ZonesFeatureCollection } from "../../../services/zonesService";
import { deliveryLabel } from "../../../utils/deliveryLabel";

type Trip = ReturnType<typeof useAddressTrip>;

// BE-2: when a fixed destination is active, logistics is a wizard-level flat
// override — NOT per-leg routing. The wizard derives this from the rental
// preview response (delivery_source === "fixed_destination") and hands the
// fee + name down so AddressStep renders one fixed line instead of the
// per-leg routing lines.
export type FixedDeliveryLine = {
  fee: number;
  destinationName: string;
};

type Props = {
  trip: Trip;
  zones?: ZonesFeatureCollection | null;
  /** Optional picker (event/emergency only) rendered ABOVE AddressList. */
  picker?: ReactNode;
  /** When set, replaces the per-leg delivery lines with one flat line. */
  fixedDelivery?: FixedDeliveryLine | null;
};

export default function AddressStep({
  trip,
  zones = null,
  picker = null,
  fixedDelivery = null,
}: Props) {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;
  const warehouse = trip.warehouse
    ? { lat: trip.warehouse.lat, lng: trip.warehouse.lon }
    : null;
  return (
    <div className="mt-4 py-6 flex flex-col gap-2">
      {picker && <div className="mb-2">{picker}</div>}
      <AddressList
        items={trip.items}
        onChange={trip.setText}
        onSelect={trip.setEntry}
        onAdd={trip.addEntry}
        onRemove={trip.removeEntry}
        placeholder={t(`${k}.step4Placeholder`)}
        addLabel={t(`${k}.step4AddAddress`)}
      />
      {/* M-5: manage expectation — address text field has no live geocoding,
          map pin doesn't reflect what user typed. Manager will reconcile. */}
      <p className="font-body text-sm leading-5 text-neutral-500">
        {t(`${k}.step4AddressHint`)}
      </p>
      <Suspense
        fallback={
          <div className="mt-0 h-[300px] lg:h-[550px] bg-neutral-100 animate-pulse rounded-[12px]" />
        }
      >
        <MapPicker
          points={trip.locations}
          onMapClick={trip.appendFromMap}
          routes={trip.routes}
          warehouse={warehouse}
          loading={trip.loading}
          loadingText={t(`${k}.step4RouteLoading`)}
          className="mt-0 h-[300px] lg:h-[550px]"
          zones={zones}
        />
      </Suspense>
      {/* BE-2: fixed destination active → flat logistics line; suppress the
          per-leg routing breakdown below (it would show a competing OSRM
          number for the same address). */}
      {fixedDelivery && (
        <div className="mt-2 flex flex-col lg:flex-row lg:gap-6 font-body text-base text-neutral-900">
          <span>
            <strong>
              {deliveryLabel(
                {
                  warehouse: { id: 0, name: "", lat: 0, lon: 0 },
                  distanceKm: 0,
                  durationMin: 0,
                  deliveryFee: fixedDelivery.fee,
                  routeGeometry: null,
                  deliverySource: "fixed_destination",
                  deliveryZone: null,
                  fixedDestinationName: fixedDelivery.destinationName,
                },
                t,
              )}
            </strong>
          </span>
          <span className="text-cta-main">
            {Math.round(fixedDelivery.fee).toLocaleString("ru-RU")}{" "}
            {t(`${k}.currency`)}
          </span>
        </div>
      )}
      {!fixedDelivery && !trip.loading && trip.error && (
        <div className="mt-2 font-body text-base text-red-600">{t(`${k}.step4RouteError`)}</div>
      )}
      {!fixedDelivery && !trip.loading && !trip.error && trip.hasPreview && (
        <div className="mt-2 flex flex-col gap-2 font-body text-base text-neutral-900">
          {trip.legs.map((leg, i) => (
            leg.preview ? (
              <div
                key={`${leg.location.lat}-${leg.location.lng}-${i}`}
                className="flex flex-col lg:flex-row lg:gap-6"
              >
                <span>
                  {t(`${k}.step4Address`)} {i + 1}:{" "}
                  <strong>{deliveryLabel(leg.preview, t)}</strong>
                </span>
                <span className="text-cta-main">
                  {Math.round(leg.preview.deliveryFee).toLocaleString("ru-RU")}{" "}
                  {t(`${k}.currency`)}
                </span>
              </div>
            ) : null
          ))}
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-6 border-t border-neutral-200 pt-2">
            <span>
              {t(`${k}.step4Distance`)}:{" "}
              <strong>
                {trip.distanceKm.toFixed(1)} {t(`${k}.step4Km`)}
              </strong>
            </span>
            <span>
              {t(`${k}.step4DeliveryCost`)}:{" "}
              <strong className="text-cta-main">
                {trip.deliveryCost.toLocaleString("ru-RU")} {t(`${k}.currency`)}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
