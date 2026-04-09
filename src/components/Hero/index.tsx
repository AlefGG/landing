import { useTranslation } from "react-i18next";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useCountUp } from "../../hooks/useCountUp";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

function StatCard({
  value,
  label,
  numericEnd,
  prefix = "",
  suffix = "",
}: {
  value: string;
  label: string;
  numericEnd?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useCountUp({
    end: numericEnd ?? 0,
    duration: 2000,
    enabled: inView && numericEnd !== undefined,
  });

  return (
    <motion.div
      ref={ref}
      className="bg-white rounded-3xl shadow-[0px_8px_20px_0px_rgba(94,117,138,0.18)] p-6 flex flex-col gap-2 w-[176px] shrink-0"
      {...fadeUp(1)}
    >
      <span className="font-heading font-light text-[28px] lg:text-[36px] leading-[36px] lg:leading-[56px] text-cta-main">
        {numericEnd !== undefined ? `${prefix}${count}${suffix}` : value}
      </span>
      <span className="font-body text-sm text-neutral-700">{label}</span>
    </motion.div>
  );
}

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative w-full overflow-hidden bg-[#f5f8f5]">
      {/* Background image */}
      <div className="absolute inset-0 lg:left-0 lg:w-[60%]">
        <img
          src="/assets/images/hero-bg.png"
          alt="Алматы — Байтерек"
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="relative max-w-[1216px] mx-auto px-4 lg:px-8 py-16 lg:py-0 lg:min-h-[700px] flex flex-col justify-center">
        {/* Content — right side on desktop */}
        <div className="lg:ml-auto lg:w-1/2 flex flex-col gap-6 items-center lg:items-end text-center lg:text-right">
          <motion.h1
            className="font-heading font-extrabold text-[32px] leading-[36px] lg:text-[56px] lg:leading-[56px] text-cta-main"
            {...fadeUp(0.4)}
          >
            {t("hero.title1")}
            <span className="text-cta-blue">{t("hero.titleHighlight")}</span>
            {t("hero.title2")}
          </motion.h1>

          <motion.p
            className="font-body text-base lg:text-xl text-neutral-700 max-w-[384px]"
            {...fadeUp(0.6)}
          >
            {t("hero.subtitle")}
          </motion.p>

          {/* 24/7 emergency card */}
          <motion.div
            className="bg-white rounded-3xl shadow-[0px_8px_20px_0px_rgba(94,117,138,0.18)] p-6 flex gap-4 items-center w-[280px]"
            {...fadeUp(0.8)}
          >
            <div>
              <p className="font-heading font-light text-2xl text-neutral-700">
                {t("hero.emergency")}
              </p>
              <p className="font-heading font-light text-[40px] text-cta-main leading-tight">
                {t("hero.emergencyBadge")}
              </p>
            </div>
            <div className="text-right text-sm text-neutral-700 whitespace-pre-line">
              {t("hero.emergencyTime")}
            </div>
            <img
              src="/assets/images/cabin-hero.png"
              alt="Биотуалет"
              className="h-[180px] w-auto object-contain"
            />
          </motion.div>
        </div>

        {/* Stat cards */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 mt-8 lg:mt-12 items-center lg:items-start">
          <StatCard
            value={t("stats.years")}
            label={t("stats.yearsLabel")}
          />
          <StatCard
            value={t("stats.partners")}
            label={t("stats.partnersLabel")}
            prefix="~"
            numericEnd={50}
          />
          <StatCard
            value={t("stats.orders")}
            label={t("stats.ordersLabel")}
            numericEnd={3500}
            suffix="+"
          />
        </div>
      </div>
    </section>
  );
}
