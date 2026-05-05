import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

export default function RentalFaq() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(1);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className="w-full bg-surface-elevated py-10 lg:py-[88px]" id="rental-faq">
      <div className="max-w-[1216px] mx-auto px-4 lg:px-0 flex flex-col items-center gap-6 lg:gap-8">
        <h2 className="font-heading font-extrabold text-2xl leading-8 lg:text-[40px] lg:leading-[40px] text-neutral-800 text-center">
          {t("wizard.rentalFaq.title")}
          <span className="text-cta-main">{t("wizard.rentalFaq.titleHighlight")}</span>
        </h2>

        <div className="w-full max-w-[1006px] flex flex-col gap-4">
          {faqKeys.map((key, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={key}
                className="bg-white rounded-3xl overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex items-start justify-between p-6 text-left gap-4"
                  aria-expanded={isOpen}
                  aria-controls={`rental-faq-answer-${i}`}
                >
                  <span className="flex items-start flex-1 min-w-0">
                    <span className="font-body font-semibold text-xl leading-6 text-cta-main w-8 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="font-body font-semibold text-base leading-6 lg:text-xl lg:leading-6 text-neutral-800">
                      {t(`wizard.rentalFaq.${key}.question`)}
                    </span>
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                    aria-hidden="true"
                  >
                    <img
                      src="/assets/icons/chevron-down.svg"
                      alt=""
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`rental-faq-answer-${i}`}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="pl-14 pr-6 pb-6 font-body text-sm leading-5 lg:text-base lg:leading-6 text-neutral-500">
                        {t(`wizard.rentalFaq.${key}.answer`)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
