import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "../../ui";
import type { CalendarDayMeta } from "../../ui/Calendar/Calendar";
import { formatDate } from "./phoneFormat";
import type { TimeSlotDTO } from "../../../services/timeSlotsService";
import type { InstallDismantleValue } from "../../../utils/installDismantleValidator";
import { deriveInstallDate } from "../../../utils/eventDate";

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
  // FE-6: EVENT-only event-date model. When `eventMode` is true, the customer
  // picks the EVENT date; the install date is derived (event − 1 day) and
  // shown LOCKED (read-only). `eventDate`/`onEventDateChange` live in the
  // wizard draft — they are UI-only and never reach the backend; only the
  // derived `value.installDate` flows through the unchanged validator/payload.
  // Emergency passes `eventMode={false}` and keeps its current behavior.
  eventMode?: boolean;
  eventDate?: Date | null;
  onEventDateChange?: (d: Date | null) => void;
  eventDayMeta?: (d: Date) => CalendarDayMeta | undefined;
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
  if (!(a instanceof Date) || !(b instanceof Date)) return false;
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
  eventMode = false,
  eventDate = null,
  onEventDateChange,
  eventDayMeta,
}: Props) {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;

  const [installCalOpen, setInstallCalOpen] = useState(false);
  const [dismantleCalOpen, setDismantleCalOpen] = useState(false);
  const [eventCalOpen, setEventCalOpen] = useState(false);
  // FE-6: red-highlight flag for the locked install field — flips on when the
  // user clicks/tries to edit the derived install date, with the
  // contact-manager hint. Cleared when the user picks a new event date.
  const [lockedTouched, setLockedTouched] = useState(false);
  const installCalRef = useRef<HTMLDivElement>(null);
  const dismantleCalRef = useRef<HTMLDivElement>(null);
  const eventCalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!eventCalOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        eventCalRef.current &&
        !eventCalRef.current.contains(e.target as Node)
      ) {
        setEventCalOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [eventCalOpen]);

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

  // FE-RX-004: auto-clear dismantle-slot when it became invalid after a
  // same-day toggle or install-slot change. Previously a child useEffect
  // mutated parent state — that effect re-fired on every parent re-render
  // (because `value` and `installSlot` had new identities each render),
  // and the resulting onChange-from-effect was a lint-invisible class of
  // setState-in-effect (the rule only flags self-state). Now the
  // sanitisation runs as a pure derivation at the onChange call site so
  // the parent receives one atomic update with the corrected dismantle
  // slot — no second-render bounce.
  const sanitizeDismantle = useCallback(
    (next: InstallDismantleValue): InstallDismantleValue => {
      if (next.dismantleSlotId == null) return next;
      if (!sameDay(next.installDate, next.dismantleDate)) return next;
      const installSlotNext = slots.find((s) => s.id === next.installSlotId);
      if (!installSlotNext) return next;
      const dismantleSlotNext = slots.find((s) => s.id === next.dismantleSlotId);
      if (!dismantleSlotNext) return next;
      if (
        timeToMinutes(dismantleSlotNext.start_time) <=
        timeToMinutes(installSlotNext.end_time)
      ) {
        return { ...next, dismantleSlotId: null };
      }
      return next;
    },
    [slots],
  );

  // FE-6: picking an event date (UI-only) derives the locked install date and
  // writes it into the existing value object so installSlotId / dismantle keep
  // flowing through the unchanged validator + payload. The eventDate itself is
  // stored in the wizard draft, not the value object, and never hits the API.
  const handleEventDateChange = useCallback(
    (d: Date | null) => {
      onEventDateChange?.(d);
      const installDate = deriveInstallDate(d);
      onChange(sanitizeDismantle({ ...value, installDate }));
      setLockedTouched(false);
      setEventCalOpen(false);
    },
    [onEventDateChange, onChange, sanitizeDismantle, value],
  );

  const slotsEmpty = !slotsLoading && slots.length === 0;
  const slotsDisabled = slotsLoading || slotsEmpty;
  const slotPlaceholder = slotsLoading
    ? t(`${k}.slotsLoading`)
    : slotsEmpty
      ? t(`${k}.slotsEmpty`)
      : t(`${k}.slotPlaceholder`);

  const installSlotSelect = (
    <select
      data-testid="install-slot-select"
      aria-label={t(`${k}.installSlotLabel`)}
      disabled={slotsDisabled}
      value={value.installSlotId == null ? "" : String(value.installSlotId)}
      onChange={(e) => {
        const v = e.target.value;
        onChange(
          sanitizeDismantle({
            ...value,
            installSlotId: v === "" ? null : Number(v),
          }),
        );
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
  );

  return (
    <div className="mt-4 flex flex-col gap-6">
      <div className="rounded-[8px] bg-[#fff7de] border border-[#f2bc70] p-4 font-body text-base leading-6 text-neutral-900">
        ⚠ {t(`${k}.${eventMode ? "installWarningEvent" : "installWarning"}`)}
      </div>

      {/* Install section */}
      {eventMode ? (
        // FE-6 EVENT model: customer picks the EVENT date; install date is
        // derived (event − 1 day), LOCKED and read-only; install time is still
        // an editable dropdown.
        <div className="flex flex-col gap-3">
          <h3 className="font-body font-semibold text-base leading-6 text-neutral-900">
            {t(`${k}.installSectionTitle`)}
          </h3>
          <div className="flex flex-col lg:flex-row gap-4 lg:flex-wrap">
            {/* Field 1: event date — the real, editable input */}
            <div className="relative w-full lg:w-[220px]" ref={eventCalRef}>
              <button
                type="button"
                data-testid="event-date-button"
                onClick={() => setEventCalOpen((v) => !v)}
                className={`flex h-10 lg:h-[44px] w-full items-center rounded-[8px] border border-neutral-400 bg-white px-[11px] text-left font-body text-base leading-6 ${
                  eventDate ? "text-neutral-900" : "text-neutral-500"
                }`}
              >
                {eventDate ? formatDate(eventDate) : t(`${k}.eventDateLabel`)}
              </button>
              {eventCalOpen && (
                <div className="absolute top-full left-0 z-[1100] mt-1">
                  <Calendar
                    mode="single"
                    value={eventDate}
                    onChange={(d) => handleEventDateChange(d as Date)}
                    dayMeta={eventDayMeta}
                  />
                </div>
              )}
            </div>
            {/* Field 2: derived install date — LOCKED / read-only */}
            <button
              type="button"
              data-testid="install-date-locked"
              aria-label={t(`${k}.installLockedHint`)}
              onClick={() => setLockedTouched(true)}
              className={`flex h-10 lg:h-[44px] w-full lg:w-[220px] items-center rounded-[8px] border px-[11px] text-left font-body text-base leading-6 ${
                lockedTouched
                  ? "bg-[#fee7e2] border-[#f2704f] text-neutral-900"
                  : "bg-neutral-100 border-neutral-300 text-neutral-700"
              }`}
            >
              {value.installDate
                ? formatDate(value.installDate)
                : t(`${k}.installDateLabel`)}
            </button>
            {/* Field 3: install time slot — editable */}
            {installSlotSelect}
          </div>
          {lockedTouched && (
            <p
              data-testid="install-locked-hint"
              className="font-body text-sm leading-5 text-[#e0533a]"
            >
              {t(`${k}.installLockedHint`)}
            </p>
          )}
        </div>
      ) : (
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
                      onChange(sanitizeDismantle({ ...value, installDate: d as Date }));
                      setInstallCalOpen(false);
                    }}
                    dayMeta={installDayMeta}
                  />
                </div>
              )}
            </div>
            {installSlotSelect}
          </div>
        </div>
      )}

      {/* Dismantle section */}
      <div className="flex flex-col gap-3">
        <h3 className="font-body font-semibold text-base leading-6 text-neutral-900">
          {t(`${k}.${eventMode ? "dismantleSectionTitleEvent" : "dismantleSectionTitle"}`)}
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
                    onChange(sanitizeDismantle({ ...value, dismantleDate: d as Date }));
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
