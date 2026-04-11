import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const advantages = [
  { key: "fast", icon: "/assets/icons/icon-fast.svg" },
  { key: "clean", icon: "/assets/icons/icon-clean.svg" },
  { key: "eco", icon: "/assets/icons/icon-eco.svg" },
  { key: "price", icon: "/assets/icons/icon-all-included.svg" },
] as const;

export default function Advantages() {
  const { t } = useTranslation();

  return (
    <section className="w-full py-[88px] bg-white" id="advantages">
      <div className="max-w-[1216px] mx-auto px-4 lg:px-0">
        <h2 className="font-heading font-extrabold text-[28px] leading-[32px] lg:text-[40px] lg:leading-[40px] text-neutral-800 text-center">
          {t("advantages.title1")}
          <span className="text-cta-main">{t("advantages.titleHighlight")}</span>
        </h2>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:gap-[16px] lg:mt-[32px]">
          {advantages.map((adv, i) => (
            <div key={adv.key} className="flex lg:contents">
              {i > 0 && (
                <div className="hidden lg:block w-px bg-neutral-300 self-stretch" />
              )}
              <motion.div
                className="flex flex-col items-center text-center px-[32px] py-[40px] flex-1 lg:w-[280px] lg:shrink-0"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <img
                  src={adv.icon}
                  alt=""
                  width={104}
                  height={104}
                  className="w-[104px] h-[104px]"
                  loading="lazy"
                />
                <h4 className="font-heading font-extrabold text-[24px] leading-[24px] text-neutral-800 mt-[24px]">
                  {t(`advantages.${adv.key}.title`)}
                </h4>
                <p className="font-body text-[16px] leading-[24px] text-neutral-500 mt-[16px]">
                  {t(`advantages.${adv.key}.description`)}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
