import { useTranslation } from "react-i18next";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { useCountUp } from "../../hooks/useCountUp";
import ResponsiveImage from "../ResponsiveImage";

const fadeUp = (delay: number, reduced: boolean) =>
  reduced
    ? { initial: false, animate: { y: 0 }, transition: { duration: 0 } }
    : {
        // Intentionally animate only y, not opacity: axe audits mid-animation
        // (automated runs don't wait for the delay+duration window) and
        // saw "partial" fg colors blended with white. Keeping opacity at
        // 1 preserves contrast while still giving a subtle slide-in.
        initial: { y: 30 },
        animate: { y: 0 },
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

function MobileStat({
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
      className="flex-1 min-w-0 flex flex-col gap-2 items-start bg-white rounded-[12px] p-2 shadow-[0px_8px_20px_0px_rgba(94,117,138,0.18)]"
      {...fadeUp(1, prefersReducedMotion)}
    >
      <span className="font-heading font-light text-2xl leading-6 text-cta-main w-full">
        {numericEnd !== undefined ? `${prefix}${count}${suffix}` : value}
      </span>
      <span className="font-body text-[10px] leading-3 text-neutral-700 w-full">
        {label}
      </span>
    </motion.div>
  );
}

export default function Hero() {
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const isKk = i18n.language === "kk";
  const desktopTitleSize = isKk
    ? "text-[40px] leading-[44px]"
    : "text-[56px] leading-[56px]";
  const mobileTitleSize = isKk
    ? "text-[26px] leading-[28px]"
    : "text-[32px] leading-[32px]";

  return (
    <section
      className="relative w-full overflow-x-clip bg-white mb-10 lg:mb-16"
      aria-labelledby="hero-heading"
    >
      {/* Decorative background shape — shift up by 64px (navbar height) so it extends behind the sticky navbar, matching wizard pages */}
      <div
        className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-[1216px] h-[712px] pointer-events-none"
        style={{ top: "-64px" }}
        aria-hidden="true"
      >
        <img
          src="/assets/images/hero-shape.svg"
          alt=""
          className="w-full h-full"
        />
      </div>

      {/* Hero image — floating island, positioned per Figma */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        <div className="max-w-[1216px] mx-auto relative h-full">
          <ResponsiveImage
            src="/assets/images/hero-bg.png"
            alt={t("a11y.heroCity")}
            sizes="100vw"
            className="absolute left-[-132px] top-[2px] w-[995px] h-[743px] object-contain"
          />
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block relative max-w-[1216px] mx-auto px-8 min-h-[712px]">
        {/* Right column: H1, subtitle */}
        <div className="absolute right-[104px] top-[120px] w-[592px] text-right">
          <motion.h1
            id="hero-heading"
            className={`font-heading font-extrabold ${desktopTitleSize} text-cta-main whitespace-pre-line`}
            {...fadeUp(0.4, prefersReducedMotion)}
          >
            {t("hero.title1")}
            <span className="text-cta-blue">{t("hero.titleHighlight")}</span>
            {t("hero.title2")}
          </motion.h1>

          <motion.p
            className="font-body font-normal text-xl leading-6 text-neutral-700 max-w-[384px] ml-auto mt-4"
            {...fadeUp(0.6, prefersReducedMotion)}
          >
            {t("hero.subtitle")}
          </motion.p>
        </div>

        {/* 24/7 card */}
        <motion.div
          className="absolute right-[104px] top-[332px] w-[280px] h-[380px] bg-white rounded-3xl shadow-[0px_8px_20px_0px_rgba(94,117,138,0.18)] overflow-hidden"
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
          <p className="absolute top-5 right-6 font-body font-normal text-base leading-6 text-neutral-700 text-right whitespace-pre-line">
            {t("hero.emergencyTime")}
          </p>
          <ResponsiveImage
            src="/assets/images/cabin-hero.png"
            alt={t("a11y.heroCabin")}
            sizes="50vw"
            priority
            priorityMedia="(min-width: 1024px)"
            width={150}
            height={252}
            className="absolute left-1/2 -translate-x-1/2 bottom-3 h-[252px] w-[150px] object-contain"
          />
        </motion.div>

        {/* Stats row */}
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

        {/* Spacer */}
        <div className="invisible" aria-hidden="true">
          <div className="h-[712px]" />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden relative flex flex-col items-center gap-4 pb-4">
        {/* Gradient background — covers chips/lang above (via negative top) through 24/7 card.
            Ends near island image so stats sit on white. */}
        <div
          aria-hidden="true"
          className="absolute left-3 right-3 rounded-2xl pointer-events-none z-0 bg-gradient-to-b from-hero-from to-hero-to"
          style={{
            top: "-104px",
            bottom: "260px",
          }}
        />

        {/* Title + subtitle/24-7 card row */}
        <div className="relative z-10 w-full px-3 pt-6 flex flex-col gap-4 items-start">
          {/* F-013: mobile copy of the hero heading is demoted to <h2> so the
              page still has exactly one <h1> in the DOM (the desktop one is
              `display: none` on mobile but axe and screen readers see both).
              Visual styling is unchanged. */}
          <motion.h2
            id="hero-heading-mobile"
            className={`font-heading font-extrabold ${mobileTitleSize} text-cta-main text-left w-full whitespace-pre-line`}
            {...fadeUp(0.4, prefersReducedMotion)}
          >
            {t("hero.title1")}
            <span className="text-cta-blue">{t("hero.titleHighlight")}</span>
            {t("hero.title2")}
          </motion.h2>

          <div className="flex gap-4 items-start w-full">
            <motion.div
              className="flex flex-col gap-2 flex-1 min-w-0 pt-2"
              {...fadeUp(0.6, prefersReducedMotion)}
            >
              <p className="font-body font-semibold text-base leading-6 text-neutral-800 opacity-80">
                {t("hero.subtitle")}
              </p>
            </motion.div>

            <motion.div
              className="relative w-[180px] h-[260px] shrink-0 bg-white rounded-2xl shadow-[0px_8px_20px_0px_rgba(94,117,138,0.18)] overflow-hidden"
              {...fadeUp(0.8, prefersReducedMotion)}
            >
              <p className="absolute top-3 left-4 font-body text-sm leading-4 text-neutral-700">
                {t("hero.emergency")}
              </p>
              <p className="absolute top-2 right-4 font-heading font-light text-[22px] leading-[32px] text-cta-main">
                {t("hero.emergencyBadge")}
              </p>
              <ResponsiveImage
                src="/assets/images/cabin-hero.png"
                alt={t("a11y.heroCabin")}
                sizes="116px"
                priority
                priorityMedia="(max-width: 1023.98px)"
                width={116}
                height={176}
                className="absolute left-1/2 -translate-x-1/2 top-[38px] w-[116px] h-[176px] object-contain"
              />
              <p className="absolute bottom-3 left-2 right-2 font-body text-[11px] leading-3 text-neutral-700 text-center whitespace-pre-line">
                {t("hero.emergencyTime")}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Hero image — floating island (mobile). Enlarged to match design. */}
        <div className="relative z-10 w-full flex items-center justify-center">
          <ResponsiveImage
            src="/assets/images/hero-bg.png"
            alt={t("a11y.heroCity")}
            sizes="100vw"
            className="w-full max-w-[480px] h-auto object-contain shrink-0"
          />
        </div>

        {/* Stats row — 3 small cards */}
        <div className="relative z-10 w-full px-3 flex gap-2 items-stretch h-[72px]">
          <MobileStat value={t("stats.years")} label={t("stats.yearsLabel")} />
          <MobileStat
            value={t("stats.partners")}
            label={t("stats.partnersLabel")}
            prefix="~"
            numericEnd={50}
          />
          <MobileStat
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
