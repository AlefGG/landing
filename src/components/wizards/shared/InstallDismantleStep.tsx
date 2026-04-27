import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "../../ui";
import type { CalendarDayMeta } from "../../ui/Calendar/Calendar";
import { formatDate } from "./phoneFormat";
import type { TimeSlotDTO } from "../../../services/timeSlotsService";
import type { InstallDismantleValue } from "../../../utils/installDismantleValidator";

type Props = {
  value: InstallDismantleValue;
  onChange: (v: InstallDismantleValue) => void;
  slots: TimeSlotDTO[];
  slotsLoading: boolean;
  serviceType: "rental_event" | "rental_emergency";
  installDayMeta?: (d: Date) => CalendarDayMeta | undefined;
  dismantleDayMeta?: (d: Date) => CalendarDayMeta | undefined;
  consent: boolean;
  onConsentChange: (v: boolean) => void;
};

function timeToMinutes(hms: string): number {
  const [h, m] = hms.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function slotLabel(s: TimeSlotDTO): string {
  const a = s.start_time.slice(0, 5);
  const b = s.end_time.slice(0, 5);
  return `${s.name} (${a}–${b})`;
}

function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function InstallDismantleStep({
  value,
  onChange,
  slots,
  slotsLoading,
  installDayMeta,
  dismantleDayMeta,
  consent,
  onConsentChange,
}: Props) {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;

  const [installCalOpen, setInstallCalOpen] = useState(false);
  const [dismantleCalOpen, setDismantleCalOpen] = useState(false);
  const installCalRef = useRef<HTMLDivElement>(null);
  const dismantleCalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!installCalOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        installCalRef.current &&
        !installCalRef.current.contains(e.target as Node)
      ) {
        setInstallCalOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [installCalOpen]);

  useEffect(() => {
    if (!dismantleCalOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dismantleCalRef.current &&
        !dismantleCalRef.current.contains(e.target as Node)
      ) {
        setDismantleCalOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dismantleCalOpen]);

  const isSameDay = sameDay(value.installDate, value.dismantleDate);
  const installSlot = slots.find((s) => s.id === value.installSlotId);

  const dismantleSlots = slots.filter((s) => {
    if (!isSameDay || !installSlot) return true;
    return timeToMinutes(s.start_time) > timeToMinutes(installSlot.end_time);
  });

  // Auto-clear dismantle slot if it became invalid after a same-day toggle
  // or install-slot change.
  useEffect(() => {
    if (
      isSameDay &&
      installSlot &&
      value.dismantleSlotId != null
    ) {
      const ds = slots.find((s) => s.id === value.dismantleSlotId);
      if (
        ds &&
        timeToMinutes(ds.start_time) <= timeToMinutes(installSlot.end_time)
      ) {
        onChange({ ...value, dismantleSlotId: null });
      }
    }
  }, [isSameDay, installSlot, value, slots, onChange]);

  const slotsEmpty = !slotsLoading && slots.length === 0;
  const slotsDisabled = slotsLoading || slotsEmpty;
  const slotPlaceholder = slotsLoading
    ? t(`${k}.slotsLoading`)
    : slotsEmpty
      ? t(`${k}.slotsEmpty`)
      : t(`${k}.slotPlaceholder`);

  return (
    <div className="mt-4 flex flex-col gap-6">
      <div className="rounded-[8px] bg-[#fff7de] border border-[#f2bc70] p-4 font-body text-base leading-6 text-neutral-900">
        ⚠ {t(`${k}.installWarning`)}
      </div>

      {/* Install section */}
      <div className="flex flex-col gap-3">
        <h3 className="font-body font-semibold text-base leading-6 text-neutral-900">
          {t(`${k}.installSectionTitle`)}
        </h3>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative w-full lg:w-[220px]" ref={installCalRef}>
            <button
              type="button"
              data-testid="install-date-button"
              onClick={() => setInstallCalOpen((v) => !v)}
              className={`flex h-10 lg:h-[44px] w-full items-center rounded-[8px] border border-neutral-400 bg-white px-[11px] text-left font-body text-base leading-6 ${
                value.installDate ? "text-neutral-900" : "text-neutral-500"
              }`}
            >
              {value.installDate
                ? formatDate(value.installDate)
                : t(`${k}.installDateLabel`)}
            </button>
            {installCalOpen && (
              <div className="absolute top-full left-0 z-[1100] mt-1">
                <Calendar
                  mode="single"
                  value={value.installDate}
                  onChange={(d) => {
                    onChange({ ...value, installDate: d as Date });
                    setInstallCalOpen(false);
                  }}
                  dayMeta={installDayMeta}
                />
              </div>
            )}
          </div>
          <select
            data-testid="install-slot-select"
            aria-label={t(`${k}.installSlotLabel`)}
            disabled={slotsDisabled}
            value={value.installSlotId == null ? "" : String(value.installSlotId)}
            onChange={(e) => {
              const v = e.target.value;
              onChange({
                ...value,
                installSlotId: v === "" ? null : Number(v),
              });
            }}
            className="h-10 lg:h-[44px] w-full lg:w-[280px] rounded-[8px] border border-neutral-400 bg-white px-[11px] font-body text-base leading-6 text-neutral-900 disabled:text-neutral-500 disabled:bg-neutral-100"
          >
            <option value="">{slotPlaceholder}</option>
            {slots.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {slotLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dismantle section */}
      <div className="flex flex-col gap-3">
        <h3 className="font-body font-semibold text-base leading-6 text-neutral-900">
          {t(`${k}.dismantleSectionTitle`)}
        </h3>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative w-full lg:w-[220px]" ref={dismantleCalRef}>
            <button
              type="button"
              data-testid="dismantle-date-button"
              onClick={() => setDismantleCalOpen((v) => !v)}
              className={`flex h-10 lg:h-[44px] w-full items-center rounded-[8px] border border-neutral-400 bg-white px-[11px] text-left font-body text-base leading-6 ${
                value.dismantleDate ? "text-neutral-900" : "text-neutral-500"
              }`}
            >
              {value.dismantleDate
                ? formatDate(value.dismantleDate)
                : t(`${k}.dismantleDateLabel`)}
            </button>
            {dismantleCalOpen && (
              <div className="absolute top-full left-0 z-[1100] mt-1">
                <Calendar
                  mode="single"
                  value={value.dismantleDate}
                  onChange={(d) => {
                    onChange({ ...value, dismantleDate: d as Date });
                    setDismantleCalOpen(false);
                  }}
                  dayMeta={dismantleDayMeta}
                />
              </div>
            )}
          </div>
          <select
            data-testid="dismantle-slot-select"
            aria-label={t(`${k}.dismantleSlotLabel`)}
            disabled={slotsDisabled}
            value={
              value.dismantleSlotId == null ? "" : String(value.dismantleSlotId)
            }
            onChange={(e) => {
              const v = e.target.value;
              onChange({
                ...value,
                dismantleSlotId: v === "" ? null : Number(v),
              });
            }}
            className="h-10 lg:h-[44px] w-full lg:w-[280px] rounded-[8px] border border-neutral-400 bg-white px-[11px] font-body text-base leading-6 text-neutral-900 disabled:text-neutral-500 disabled:bg-neutral-100"
          >
            <option value="">{slotPlaceholder}</option>
            {dismantleSlots.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {slotLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          data-testid="install-consent"
          checked={consent}
          onChange={(e) => onConsentChange(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <span className="font-body text-base leading-6 text-neutral-900">
          {t(`${k}.installConsentLabel`)}
        </span>
      </label>
      {!consent && (
        <p className="font-body text-sm leading-4 text-neutral-500 -mt-3">
          {t(`${k}.installConsentRequired`)}
        </p>
      )}
    </div>
  );
}
