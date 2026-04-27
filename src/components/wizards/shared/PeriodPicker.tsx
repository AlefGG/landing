import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "../../ui";

type Props = {
  start: Date | null;
  end: Date | null;
  onStartChange: (d: Date | null) => void;
  onEndChange: (d: Date | null) => void;
};

function fmt(d: Date): string {
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PeriodPicker({
  start,
  end,
  onStartChange,
  onEndChange,
}: Props) {
  const { t } = useTranslation();
  const k = "wizard.service.period";

  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);
  const refStart = useRef<HTMLDivElement>(null);
  const refEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openStart && !openEnd) return;
    const handle = (e: MouseEvent) => {
      if (
        refStart.current &&
        !refStart.current.contains(e.target as Node) &&
        openStart
      ) {
        setOpenStart(false);
      }
      if (
        refEnd.current &&
        !refEnd.current.contains(e.target as Node) &&
        openEnd
      ) {
        setOpenEnd(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [openStart, openEnd]);

  return (
    <div className="mt-4 flex flex-col lg:flex-row gap-4 lg:gap-8">
      <div className="flex flex-col gap-2 w-full lg:w-[280px]">
        <label className="font-body text-base lg:text-xl leading-6 text-neutral-600">
          {t(`${k}.startLabel`)}
        </label>
        <div className="relative w-full" ref={refStart}>
          <button
            type="button"
            onClick={() => setOpenStart((v) => !v)}
            className={`flex h-10 lg:h-[44px] w-full items-center rounded-[8px] border border-neutral-400 bg-white px-[11px] text-left font-body text-base leading-6 ${start ? "text-neutral-900" : "text-neutral-500"}`}
          >
            {start ? fmt(start) : t(`${k}.startPlaceholder`)}
          </button>
          {openStart && (
            <div className="absolute top-full left-0 z-50 mt-1">
              <Calendar
                mode="single"
                value={start}
                onChange={(d) => {
                  onStartChange(d as Date);
                  setOpenStart(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full lg:w-[280px]">
        <label className="font-body text-base lg:text-xl leading-6 text-neutral-600">
          {t(`${k}.endLabel`)}
        </label>
        <div className="relative w-full" ref={refEnd}>
          <button
            type="button"
            onClick={() => setOpenEnd((v) => !v)}
            className={`flex h-10 lg:h-[44px] w-full items-center rounded-[8px] border border-neutral-400 bg-white px-[11px] text-left font-body text-base leading-6 ${end ? "text-neutral-900" : "text-neutral-500"}`}
          >
            {end ? fmt(end) : t(`${k}.endPlaceholder`)}
          </button>
          {openEnd && (
            <div className="absolute top-full left-0 z-50 mt-1">
              <Calendar
                mode="single"
                value={end}
                onChange={(d) => {
                  onEndChange(d as Date);
                  setOpenEnd(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
