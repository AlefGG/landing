import { useTranslation } from "react-i18next";
import { useFixedDestinations } from "../../../hooks/useFixedDestinations";
import RadioRow from "./RadioRow";

type Props = {
  /** Currently selected destination id, or null when in "normal address" mode. */
  value: number | null;
  /** Toggle "named destination" mode on/off. Off → null + restores normal flow. */
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onSelect: (id: number | null) => void;
};

/**
 * BE-2: lets the customer optionally pick a named far-away destination
 * (e.g. "Алматы–Кольсай") as a logistics PRICING OVERRIDE. The map pin /
 * address autocomplete still apply — the destination does not replace the
 * pin, it only flips the backend onto flat fixed-destination pricing.
 *
 * Rendered ABOVE AddressList in AddressStep (event/emergency wizards only).
 */
export default function FixedDestinationPicker({
  value,
  enabled,
  onToggle,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;
  const { destinations, loading, error } = useFixedDestinations();

  return (
    <div className="flex flex-col gap-3" data-testid="fixed-destination-picker">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        <RadioRow
          testId="destination-toggle-address"
          selected={!enabled}
          onClick={() => onToggle(false)}
          label={t(`${k}.destinationToggleAddress`)}
        />
        <RadioRow
          testId="destination-toggle-named"
          selected={enabled}
          onClick={() => onToggle(true)}
          label={t(`${k}.destinationToggleNamed`)}
        />
      </div>

      {enabled && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="fixed-destination-select"
            className="font-body text-base leading-6 text-neutral-900"
          >
            {t(`${k}.destinationLabel`)}
          </label>
          {loading ? (
            <p className="font-body text-base text-neutral-500">
              {t(`${k}.destinationLoading`)}
            </p>
          ) : error ? (
            <p className="font-body text-base text-red-600">
              {t(`${k}.destinationError`)}
            </p>
          ) : destinations.length === 0 ? (
            <p className="font-body text-base text-neutral-500">
              {t(`${k}.destinationEmpty`)}
            </p>
          ) : (
            <select
              id="fixed-destination-select"
              data-testid="fixed-destination-select"
              aria-label={t(`${k}.destinationLabel`)}
              value={value == null ? "" : String(value)}
              onChange={(e) => {
                const v = e.target.value;
                onSelect(v === "" ? null : Number(v));
              }}
              className="h-10 lg:h-[44px] w-full lg:w-[360px] rounded-[8px] border border-neutral-400 bg-white px-[11px] font-body text-base leading-6 text-neutral-900"
            >
              <option value="">{t(`${k}.destinationPlaceholder`)}</option>
              {destinations.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
