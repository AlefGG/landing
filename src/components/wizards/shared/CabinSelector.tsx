import { useTranslation } from "react-i18next";
import { rentalCabins, type CabinType } from "./cabinData";
import { useCabinTypes, type CabinTypeDTO } from "../../../hooks/useCabinTypes";

const UI_TO_BACKEND: Record<CabinType, string> = {
  standard: "standard",
  lux: "luxury",
  vip: "vip",
};

function findByUiSlug(
  types: CabinTypeDTO[] | null,
  uiSlug: CabinType,
): CabinTypeDTO | null {
  if (!types) return null;
  const backendSlug = UI_TO_BACKEND[uiSlug];
  const matches = types.filter((t) => t.slug === backendSlug);
  if (matches.length === 0) return null;
  return matches.find((t) => !!t.photo) ?? matches[0] ?? null;
}

export default function CabinSelector({
  value,
  onChange,
}: {
  value: CabinType;
  onChange: (v: CabinType) => void;
}) {
  const { t } = useTranslation();
  const { types } = useCabinTypes("rental");
  const labels: Record<CabinType, string> = {
    standard: t("wizard.cabins.standard"),
    lux: t("wizard.cabins.lux"),
    vip: t("wizard.cabins.vip"),
  };
  return (
    <div className="mt-4 py-4 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-4 lg:gap-4">
      {rentalCabins.map(({ type, image }) => {
        const dto = findByUiSlug(types, type);
        const imgSrc = dto?.photo && dto.photo.length > 0 ? dto.photo : image;
        const description = dto?.description?.trim() ?? "";
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className="flex items-center lg:flex-col gap-6 w-full lg:w-[288px] px-0 lg:px-10 py-0 lg:py-4 rounded-3xl bg-white transition-shadow hover:shadow-md"
          >
            <img
              src={imgSrc}
              alt={labels[type]}
              className="h-[98px] lg:h-[200px] w-auto object-contain shrink-0"
            />
            <div className="flex flex-col items-start lg:items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`size-5 shrink-0 rounded-full overflow-hidden ${
                    value === type
                      ? "bg-cta-main flex items-center justify-center"
                      : "border border-neutral-500"
                  }`}
                >
                  {value === type && <span className="size-[6px] rounded-full bg-white" />}
                </span>
                <span className="font-body text-xl leading-6 text-neutral-900">{labels[type]}</span>
              </div>
              {description && (
                <p className="font-body text-sm leading-5 text-neutral-600 text-left lg:text-center">
                  {description}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
