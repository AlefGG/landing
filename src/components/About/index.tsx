import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { SectionTitle } from "../ui";

const facts = [
  { key: "years", valueKey: "years", unitKey: "yearsUnit" },
  { key: "cabins", valueKey: "cabinsCount" },
  { key: "people", valueKey: "people" },
  { key: "partners", valueKey: "partnersCount" },
] as const;

export default function About() {
  const { t } = useTranslation();

  return (
    <section className="relative w-full py-16 lg:py-24 overflow-hidden" id="about">
      {/* Background image — desktop only */}
      <div className="absolute inset-0 hidden lg:block">
        <img
          src="/assets/images/about-bg.jpg"
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="relative max-w-[1216px] mx-auto px-4 lg:px-8">
        <motion.div
          className="lg:w-1/2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <SectionTitle className="text-left">{t("about.heading")}</SectionTitle>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {facts.map((fact, i) => {
              const unitKey = "unitKey" in fact ? fact.unitKey : undefined;
              return (
                <motion.div
                  key={fact.key}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <span className="font-heading font-light text-[36px] leading-[56px] text-cta-main">
                    {t(`about.${fact.valueKey}`)}
                    {unitKey && (
                      <span className="text-[24px] ml-1">
                        {t(`about.${unitKey}`)}
                      </span>
                    )}
                  </span>
                  <p className="font-body text-sm text-neutral-700 mt-1">
                    {t(`about.${fact.key}Label`)}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <motion.a
            href="#"
            className="inline-flex items-center gap-2 mt-6 text-cta-main font-body font-semibold hover:underline"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            {t("about.link")} →
          </motion.a>
        </motion.div>
      </div>

      {/* Footer badge — desktop only */}
      <div className="absolute top-20 right-8 hidden lg:block">
        <img
          src="/assets/logos/footer-badge.svg"
          alt=""
          className="w-32 h-32"
          loading="lazy"
        />
      </div>
    </section>
  );
}
