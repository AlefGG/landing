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
      className="relative w-full h-[768px] overflow-hidden bg-white"
      id="about"
      aria-labelledby="about-heading"
    >
      {/* Blurred background photo with right-fade gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/assets/images/about-bg.jpg"
          alt=""
          className="absolute -top-[14px] -left-[23px] w-[1635px] h-[1031px] object-cover blur-[5.5px]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent from-[34.3%] to-white/50 to-[72.2%]" />
      </div>

      {/* Decorative circular badge top-right */}
      <img
        src="/assets/logos/footer-badge.svg"
        alt=""
        width={128}
        height={128}
        className="absolute top-[82px] right-[162px] w-32 h-32 hidden lg:block pointer-events-none"
        loading="lazy"
      />

      {/* Left content column, vertically centered */}
      <div className="relative max-w-[1216px] mx-auto px-4 lg:px-0 h-full flex items-center">
        <motion.div
          className="w-full lg:w-[592px] flex flex-col gap-[72px]"
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
            <div className="flex flex-wrap gap-y-[40px] gap-x-[32px]">
              {facts.map((fact) => (
                <div
                  key={fact.value}
                  className="flex flex-col items-start gap-2 w-[280px]"
                >
                  <span className="font-heading font-extrabold text-[40px] leading-[40px] text-cta-main">
                    {t(fact.value)}
                    {"unit" in fact && (
                      <span className="ml-2 text-[24px] leading-[24px] align-baseline">
                        {t(fact.unit)}
                      </span>
                    )}
                  </span>
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
