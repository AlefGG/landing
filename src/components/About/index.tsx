import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const facts = [
  { value: "about.years" as const, unit: "about.yearsUnit" as const, desc: "about.yearsDesc" as const },
  { value: "about.cabinsCount" as const, desc: "about.cabinsDesc" as const },
  { value: "about.people" as const, desc: "about.peopleDesc" as const },
  { value: "about.partnersCount" as const, desc: "about.partnersDesc" as const },
] as const;

export default function About() {
  const { t } = useTranslation();

  return (
    <section
      className="relative w-full min-h-[500px] lg:h-[clamp(600px,45vw,900px)] overflow-hidden bg-white"
      id="about"
      aria-labelledby="about-heading"
    >
      {/* Background photo — NO blur, stretches full width */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/assets/images/about-bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="lazy"
        />
        {/* Gradient overlay: solid white on the left fading to transparent on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-white from-[10%] via-white/90 via-[35%] to-transparent to-[65%]" />
      </div>

      {/* Left content column, vertically centered */}
      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-[192px] h-full flex items-center py-12 lg:py-0">
        <motion.div
          className="w-full sm:w-[min(592px,60vw)] lg:w-[592px] flex flex-col gap-10 lg:gap-[72px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            id="about-heading"
            className="font-heading font-extrabold text-[28px] leading-[32px] lg:text-[40px] lg:leading-[40px] text-neutral-900"
          >
            {t("about.heading")}
          </h2>

          <div className="flex flex-col gap-10 lg:gap-[80px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-8 lg:w-[592px]">
              {facts.map((fact) => (
                <div
                  key={fact.value}
                  className="flex flex-col items-start gap-2 w-[280px]"
                >
                  <div className="flex items-start">
                    <span className="font-heading font-extrabold text-[48px] leading-[56px] lg:text-[64px] lg:leading-[72px] text-cta-main">
                      {t(fact.value)}
                    </span>
                    {"unit" in fact && (
                      <span className="ml-1 mt-[2px] lg:mt-[4px] font-heading font-extrabold text-[24px] leading-[28px] lg:text-[32px] lg:leading-[36px] text-cta-main">
                        {t(fact.unit)}
                      </span>
                    )}
                  </div>
                  <p className="font-body font-normal text-base leading-6 lg:text-[20px] lg:leading-[24px] text-neutral-800">
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
