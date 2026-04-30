import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { AddressList } from "../../ui";
import type { useAddressTrip } from "../../../hooks/useAddressTrip";

const MapPicker = lazy(() => import("../../ui/MapPicker"));
import type { ZonesFeatureCollection } from "../../../services/zonesService";
import { deliveryLabel } from "../../../utils/deliveryLabel";

type Trip = ReturnType<typeof useAddressTrip>;

type Props = {
  trip: Trip;
  zones?: ZonesFeatureCollection | null;
};

export default function AddressStep({ trip, zones = null }: Props) {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;
  const warehouse = trip.warehouse
    ? { lat: trip.warehouse.lat, lng: trip.warehouse.lon }
    : null;
  return (
    <div className="mt-4 py-6 flex flex-col gap-2">
      <AddressList
        items={trip.items}
        onChange={trip.setText}
        onSelect={trip.setEntry}
        onAdd={trip.addEntry}
        onRemove={trip.removeEntry}
        placeholder={t(`${k}.step4Placeholder`)}
        addLabel={t(`${k}.step4AddAddress`)}
      />
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
      {!trip.loading && trip.error && (
        <div className="mt-2 font-body text-base text-red-600">{t(`${k}.step4RouteError`)}</div>
      )}
      {!trip.loading && !trip.error && trip.hasPreview && (
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
