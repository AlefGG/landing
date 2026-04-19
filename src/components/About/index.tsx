import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const facts = [
  { value: "about.years" as const, unit: "about.yearsUnit" as const, desc: "about.yearsDesc" as const, label: "about.yearsLabel" as const },
  { value: "about.cabinsCount" as const, desc: "about.cabinsDesc" as const, label: "about.cabinsLabel" as const },
  { value: "about.people" as const, desc: "about.peopleDesc" as const, label: "about.peopleLabel" as const },
  { value: "about.partnersCount" as const, desc: "about.partnersDesc" as const, label: "about.partnersLabel" as const },
] as const;

export default function About() {
  const { t } = useTranslation();

  return (
    <section
      className="relative w-full bg-[#ecece8] lg:bg-white lg:min-h-[500px] lg:h-[clamp(600px,45vw,900px)] lg:overflow-hidden"
      id="about"
      aria-label={t("about.heading")}
    >
      {/* Mobile layout */}
      <div className="lg:hidden flex flex-col items-center pt-12 px-3">
        <h2
          id="about-heading-mobile"
          className="font-heading font-semibold text-[24px] leading-[24px] text-neutral-900 w-full"
        >
          {t("about.heading")}
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 w-full pb-4">
          {facts.map((fact) => (
            <div key={fact.value} className="flex flex-col items-start w-[160px]">
              <div className="flex items-start h-[56px]">
                <span className="font-heading font-extrabold text-[40px] leading-[56px] text-cta-main">
                  {t(fact.value)}
                </span>
                {"unit" in fact && (
                  <span className="ml-1 mt-[6px] font-heading font-extrabold text-[20px] leading-[24px] text-cta-main">
                    {t(fact.unit)}
                  </span>
                )}
              </div>
              <p className="font-body font-normal text-[13px] leading-4 text-neutral-800">
                {t(fact.desc)}
              </p>
            </div>
          ))}
        </div>

        <div className="w-screen h-[227px] relative overflow-hidden">
          <img
            src="/assets/images/about-bg.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent from-[88%] to-[#ecece8]" />
        </div>
      </div>

      {/* Desktop layout — unchanged */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        <img
          src="/assets/images/about-bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white from-[10%] via-white/95 via-[50%] to-transparent to-[80%] xl:via-[40%] xl:to-[70%] 2xl:via-[35%] 2xl:to-[65%]" />
      </div>

      <div className="hidden lg:flex relative max-w-[1600px] mx-auto px-[192px] h-full items-center">
        <img
          src="/assets/images/about-badge.png"
          alt=""
          aria-hidden="true"
          className="hidden xl:block absolute right-[192px] top-[82px] w-32 h-32 pointer-events-none"
        />
        <motion.div
          className="w-[592px] flex flex-col gap-[72px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            id="about-heading"
            className="font-heading font-extrabold text-[40px] leading-[40px] text-neutral-900"
          >
            {t("about.heading")}
          </h2>

          <div className="flex flex-col gap-[80px]">
            <div className="grid grid-cols-2 gap-y-10 gap-x-8 w-[592px]">
              {facts.map((fact) => (
                <div
                  key={fact.value}
                  className="flex flex-col items-start gap-2 w-[280px]"
                >
                  <div className="flex items-start">
                    <span className="font-heading font-extrabold text-[64px] leading-[72px] text-cta-main">
                      {t(fact.value)}
                    </span>
                    {"unit" in fact && (
                      <span className="ml-1 mt-[4px] font-heading font-extrabold text-[32px] leading-[36px] text-cta-main">
                        {t(fact.unit)}
                      </span>
                    )}
                  </div>
                  <p className="font-body font-normal text-[20px] leading-[24px] text-neutral-800">
                    {t(fact.desc)}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 font-body font-semibold text-[16px] leading-[24px] text-cta-blue underline hover:no-underline"
            >
              {t("about.link")}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9.62 3.95L13.67 8L9.62 12.05"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2.33 8H13.55"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
