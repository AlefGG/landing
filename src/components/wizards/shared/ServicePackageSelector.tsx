import { useTranslation } from "react-i18next";
import type { ServicePackageDTO } from "../../../services/servicePackagesService";

type Props = {
  packages: ServicePackageDTO[];
  loading: boolean;
  value: number | null;
  onChange: (id: number | null) => void;
};

export default function ServicePackageSelector({
  packages,
  loading,
  value,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const k = "wizard.sanitation.package";

  if (loading) {
    return (
      <p className="mt-4 font-body text-base text-neutral-500">
        {t(`${k}.loading`)}
      </p>
    );
  }
  if (packages.length === 0) {
    return (
      <p className="mt-4 font-body text-base text-neutral-500">
        {t(`${k}.empty`)}
      </p>
    );
  }

  return (
    <ul className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
      {packages.map((p) => {
        const selected = value === p.id;
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onChange(selected ? null : p.id)}
              aria-pressed={selected}
              className={`w-full text-left rounded-3xl bg-white px-4 py-3 lg:px-5 lg:py-4 shadow-sm border ${selected ? "border-cta-main" : "border-neutral-200"}`}
            >
              <span className="font-body text-lg leading-6 text-neutral-900 block">
                {p.name}
              </span>
              <span className="font-body text-sm leading-5 text-neutral-600 block mt-1">
                {t(`${k}.frequencyLabel`, { count: p.visits_per_week })}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
