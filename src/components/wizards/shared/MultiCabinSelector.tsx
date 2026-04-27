import { useTranslation } from "react-i18next";
import type { CabinTypeDTO } from "../../../hooks/useCabinTypes";
import { rentalCabins, type CabinType } from "./cabinData";
import QuantityStepper from "./QuantityStepper";

const BACKEND_TO_UI: Record<string, CabinType> = {
  standard: "standard",
  luxury: "lux",
  vip: "vip",
};

function fallbackImageFor(slug: string): string | null {
  const uiSlug = BACKEND_TO_UI[slug];
  if (!uiSlug) return null;
  const found = rentalCabins.find((c) => c.type === uiSlug);
  return found?.image ?? null;
}

function labelFor(t: (k: string) => string, dto: CabinTypeDTO): string {
  const uiSlug = BACKEND_TO_UI[dto.slug];
  if (uiSlug) {
    const translated = t(`wizard.cabins.${uiSlug}`);
    if (translated && translated !== `wizard.cabins.${uiSlug}`) return translated;
  }
  return dto.name;
}

export type CabinQuantityMap = Map<number, number>;

type Props = {
  types: CabinTypeDTO[] | null;
  loading: boolean;
  quantities: CabinQuantityMap;
  onChange: (next: CabinQuantityMap) => void;
};

export default function MultiCabinSelector({
  types,
  loading,
  quantities,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const k = "wizard.rental.cabinSelector";

  if (loading || types === null) {
    return (
      <div className="mt-4 py-4">
        <p className="font-body text-base text-neutral-500">
          {t(`${k}.loading`)}
        </p>
      </div>
    );
  }

  if (types.length === 0) {
    return (
      <div className="mt-4 py-4">
        <p className="font-body text-base text-neutral-500">
          {t(`${k}.noCabinTypes`)}
        </p>
      </div>
    );
  }

  const sorted = [...types].sort((a, b) => a.id - b.id);
  let total = 0;
  for (const dto of sorted) total += quantities.get(dto.id) ?? 0;

  const handleQuantity = (id: number, q: number) => {
    const next = new Map(quantities);
    if (q <= 0) next.delete(id);
    else next.set(id, q);
    onChange(next);
  };

  return (
    <div className="mt-4 py-4 flex flex-col gap-4">
      <p className="font-body text-sm leading-5 text-neutral-500">
        {t(`${k}.hint`)}
      </p>
      <ul className="flex flex-col gap-3">
        {sorted.map((dto) => {
          const value = quantities.get(dto.id) ?? 0;
          const photo =
            (dto.photo && dto.photo.length > 0 ? dto.photo : null) ??
            fallbackImageFor(dto.slug);
          const label = labelFor(t, dto);
          const description = dto.description?.trim() ?? "";
          return (
            <li
              key={dto.id}
              className="flex items-center gap-4 lg:gap-6 rounded-3xl bg-white px-4 py-3 lg:px-6 lg:py-4 shadow-sm"
            >
              {photo ? (
                <img
                  src={photo}
                  alt={label}
                  className="h-[72px] w-[72px] lg:h-[100px] lg:w-[100px] object-contain shrink-0"
                />
              ) : (
                <div className="h-[72px] w-[72px] lg:h-[100px] lg:w-[100px] shrink-0 rounded-2xl bg-neutral-100" />
              )}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <span className="font-body text-lg lg:text-xl leading-6 text-neutral-900">
                  {label}
                </span>
                {description && (
                  <p className="font-body text-sm leading-5 text-neutral-600">
                    {description}
                  </p>
                )}
              </div>
              <div className="shrink-0">
                <QuantityStepper
                  value={value}
                  onChange={(q) => handleQuantity(dto.id, q)}
                  min={0}
                  ariaLabel={label}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="font-body text-base text-neutral-600">
          {t(`${k}.totalLabel`)}:
        </span>
        <span className="font-body text-xl font-semibold text-neutral-900">
          {t(`${k}.totalUnit`, { count: total })}
        </span>
      </div>
    </div>
  );
}
