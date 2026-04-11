import { useTranslation } from "react-i18next";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { useCountUp } from "../../hooks/useCountUp";

const fadeUp = (delay: number, reduced: boolean) =>
  reduced
    ? { initial: false, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, delay },
      };

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
  const prefersReducedMotion = useReducedMotion() ?? false;
  const count = useCountUp({
    end: numericEnd ?? 0,
    duration: prefersReducedMotion ? 0 : 2000,
    enabled: inView && numericEnd !== undefined,
  });

  return (
    <motion.div
      ref={ref}
      className="bg-white rounded-3xl shadow-[0px_8px_20px_0px_rgba(94,117,138,0.18)] pt-6 pb-8 px-6 flex flex-col gap-[7px] w-full sm:w-[176px] h-auto sm:h-[151px] shrink-0"
      {...fadeUp(1, prefersReducedMotion)}
    >
      <span className="font-heading font-light text-[36px] leading-[56px] text-cta-main">
        {numericEnd !== undefined ? `${prefix}${count}${suffix}` : value}
      </span>
      <span className="font-body text-sm leading-4 text-neutral-700">{label}</span>
    </motion.div>
  );
}

export default function Hero() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <section
      className="relative w-full overflow-hidden bg-white"
      aria-labelledby="hero-heading"
    >
      {/* Background photo — absolutely positioned on desktop, hidden on mobile */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        <img
          src="/assets/images/hero-bg.png"
          alt={t("a11y.heroCity")}
          className="absolute left-[4.75%] top-[23.4%] w-[57.87%] h-[69.8%] object-cover rounded-[32px]"
        />
      </div>

      {/* Desktop layout (absolute positioning) */}
      <div className="hidden lg:block relative max-w-[1216px] mx-auto px-8 min-h-[752px]">
        {/* Right column: H1, subtitle */}
        <div className="absolute right-8 top-[120px] w-full max-w-[592px] text-right">
          <motion.h1
            id="hero-heading"
            className="font-heading font-extrabold text-[56px] leading-[56px] text-cta-main"
            {...fadeUp(0.4, prefersReducedMotion)}
          >
            {t("hero.title1")}
            <span className="text-cta-blue">{t("hero.titleHighlight")}</span>
            {t("hero.title2")}
          </motion.h1>

          <motion.p
            className="font-body text-xl leading-6 text-neutral-700 max-w-[384px] ml-auto mt-4"
            {...fadeUp(0.6, prefersReducedMotion)}
          >
            {t("hero.subtitle")}
          </motion.p>
        </div>

        {/* 24/7 card — bottom-right, standalone 280x380 */}
        <motion.div
          className="absolute right-8 top-[332px] w-[280px] h-[380px] bg-white rounded-3xl shadow-[0px_8px_20px_0px_rgba(94,117,138,0.18)] overflow-hidden"
          {...fadeUp(0.8, prefersReducedMotion)}
        >
          <div className="absolute top-6 left-6">
            <p className="font-heading font-light text-2xl leading-[56px] text-neutral-700">
              {t("hero.emergency")}
            </p>
            <p className="font-heading font-light text-[40px] leading-[56px] text-cta-main -mt-4">
              {t("hero.emergencyBadge")}
            </p>
          </div>
          <p className="absolute top-5 right-6 font-body text-base leading-6 text-neutral-700 text-right whitespace-pre-line">
            {t("hero.emergencyTime")}
          </p>
          <img
            src="/assets/images/cabin-hero.png"
            alt={t("a11y.heroCabin")}
            width={150}
            height={252}
            className="absolute left-1/2 -translate-x-1/2 bottom-3 h-[252px] w-[150px] object-contain"
          />
        </motion.div>

        {/* Stats row — 3 cards floating over bottom of bg */}
        <div className="absolute left-[104px] top-[528px] flex gap-8 items-start">
          <StatCard value={t("stats.years")} label={t("stats.yearsLabel")} />
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

        {/* Spacer to give the section its min-height */}
        <div className="invisible" aria-hidden="true">
          <div className="h-[752px]" />
        </div>
      </div>

      {/* Mobile layout (flow-based) */}
      <div className="lg:hidden max-w-[1216px] mx-auto px-4 py-8">
        {/* Hero bg as top decoration on tablet, hidden on small mobile */}
        <img
          src="/assets/images/hero-bg.png"
          alt={t("a11y.heroCity")}
          className="hidden sm:block w-full h-[200px] object-cover rounded-[24px] mb-6"
        />

        {/* H1 + subtitle */}
        <motion.h1
          id="hero-heading-mobile"
          className="font-heading font-extrabold text-[32px] leading-[36px] text-cta-main text-center"
          {...fadeUp(0.4, prefersReducedMotion)}
        >
          {t("hero.title1")}
          <span className="text-cta-blue">{t("hero.titleHighlight")}</span>
          {t("hero.title2")}
        </motion.h1>

        <motion.p
          className="font-body text-base leading-6 text-neutral-700 mt-4 text-center max-w-[384px] mx-auto"
          {...fadeUp(0.6, prefersReducedMotion)}
        >
          {t("hero.subtitle")}
        </motion.p>

        {/* 24/7 card */}
        <motion.div
          className="relative w-full max-w-[280px] h-[380px] mx-auto mt-8 bg-white rounded-3xl shadow-[0px_8px_20px_0px_rgba(94,117,138,0.18)] overflow-hidden"
          {...fadeUp(0.8, prefersReducedMotion)}
        >
          <div className="absolute top-6 left-6">
            <p className="font-heading font-light text-2xl leading-[56px] text-neutral-700">
              {t("hero.emergency")}
            </p>
            <p className="font-heading font-light text-[40px] leading-[56px] text-cta-main -mt-4">
              {t("hero.emergencyBadge")}
            </p>
          </div>
          <p className="absolute top-5 right-6 font-body text-base leading-6 text-neutral-700 text-right whitespace-pre-line">
            {t("hero.emergencyTime")}
          </p>
          <img
            src="/assets/images/cabin-hero.png"
            alt={t("a11y.heroCabin")}
            width={150}
            height={252}
            className="absolute left-1/2 -translate-x-1/2 bottom-3 h-[252px] w-[150px] object-contain"
          />
        </motion.div>

        {/* Stats row */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-8 items-center sm:justify-center">
          <StatCard value={t("stats.years")} label={t("stats.yearsLabel")} />
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
