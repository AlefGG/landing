import { useTranslation } from "react-i18next";
import { AddressList, MapPicker } from "../../ui";
import type { useAddressTrip } from "../../../hooks/useAddressTrip";

type Trip = ReturnType<typeof useAddressTrip>;

export default function AddressStep({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;
  return (
    <div className="mt-4 py-6 flex flex-col gap-2">
      <AddressList
        items={trip.items}
        onChange={trip.setText}
        onSelect={trip.setLocation}
        onAdd={trip.addEntry}
        onRemove={trip.removeEntry}
        placeholder={t(`${k}.step4Placeholder`)}
        addLabel={t(`${k}.step4AddAddress`)}
      />
      <MapPicker
        points={trip.locations}
        onMapClick={trip.appendFromMap}
        route={trip.trip?.geometry ?? []}
        loading={trip.loading}
        loadingText={t(`${k}.step4RouteLoading`)}
        className="mt-0 h-[300px] lg:h-[550px]"
      />
      {!trip.loading && trip.error && (
        <div className="mt-2 font-body text-base text-red-600">{t(`${k}.step4RouteError`)}</div>
      )}
      {!trip.loading && !trip.error && trip.trip && (
        <div className="mt-2 flex flex-col lg:flex-row gap-2 lg:gap-6 font-body text-base text-neutral-900">
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
      )}
    </div>
  );
}
