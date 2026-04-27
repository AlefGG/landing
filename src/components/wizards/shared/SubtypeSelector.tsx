import { useTranslation } from "react-i18next";
import type { ServiceSubtype } from "../../../utils/serviceSubtypeValidator";

type Props = {
  value: ServiceSubtype;
  onChange: (v: ServiceSubtype) => void;
};

export default function SubtypeSelector({ value, onChange }: Props) {
  const { t } = useTranslation();
  const k = "wizard.service.subtype";

  const options = [
    {
      id: "ONE_TIME" as ServiceSubtype,
      title: t(`${k}.oneTime`),
      desc: t(`${k}.oneTimeDesc`),
    },
    {
      id: "MONTHLY" as ServiceSubtype,
      title: t(`${k}.monthly`),
      desc: t(`${k}.monthlyDesc`),
    },
  ];

  return (
    <ul className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
      {options.map((o) => {
        const selected = value === o.id;
        return (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => onChange(o.id)}
              aria-pressed={selected}
              className={`w-full text-left rounded-3xl bg-white px-4 py-3 lg:px-6 lg:py-4 shadow-sm border ${selected ? "border-cta-main" : "border-neutral-200"}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`size-5 shrink-0 rounded-full ${selected ? "bg-cta-main flex items-center justify-center" : "border border-neutral-500"}`}
                >
                  {selected && <span className="size-2 rounded-full bg-white" />}
                </span>
                <span className="font-body text-lg lg:text-xl leading-6 text-neutral-900">
                  {o.title}
                </span>
              </div>
              <p className="mt-1 ml-8 font-body text-sm leading-5 text-neutral-600">
                {o.desc}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
