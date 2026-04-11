import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

export default function Faq() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className="w-full bg-[#efefef] py-[88px]" id="faq">
      <div className="max-w-[1216px] mx-auto px-4 lg:px-0 flex flex-col items-center gap-8">
        <h2 className="font-heading font-extrabold text-[28px] leading-[32px] lg:text-[40px] lg:leading-[40px] text-neutral-800 text-center">
          {t("faq.title")}
          <span className="text-cta-main">{t("faq.titleHighlight")}</span>
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
                  className="w-full flex items-center justify-between p-6 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span className="flex items-start gap-0">
                    <span className="font-body font-semibold text-xl leading-6 text-cta-main w-8 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="font-body font-semibold text-xl leading-6 text-neutral-800">
                      {t(`faq.${key}.question`)}
                    </span>
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 ml-4"
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
                      id={`faq-answer-${i}`}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 pl-14 font-body text-base leading-6 text-neutral-500">
                        {t(`faq.${key}.answer`)}
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
