import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { SectionTitle } from "../ui";

const advantages = [
  { key: "fast", icon: "/assets/icons/icon-fast.svg" },
  { key: "clean", icon: "/assets/icons/icon-clean.svg" },
  { key: "eco", icon: "/assets/icons/icon-eco.svg" },
  { key: "price", icon: "/assets/icons/icon-all-included.svg" },
] as const;

export default function Advantages() {
  const { t } = useTranslation();

  return (
    <section className="w-full py-16 lg:py-24" id="advantages">
      <div className="max-w-[1216px] mx-auto px-4 lg:px-8">
        <SectionTitle>{t("advantages.title")}</SectionTitle>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 mt-10">
          {advantages.map((adv, i) => (
            <div key={adv.key} className="flex">
              {i > 0 && (
                <div className="hidden lg:block w-px bg-neutral-300 self-stretch" />
              )}
              <motion.div
                className="flex flex-col items-center text-center px-6 py-8 flex-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <img
                  src={adv.icon}
                  alt=""
                  className="w-[104px] h-[104px] mb-6"
                  loading="lazy"
                />
                <h4 className="font-heading font-extrabold text-[20px] lg:text-[24px] text-neutral-800">
                  {t(`advantages.${adv.key}.title`)}
                </h4>
                <p className="font-body text-base text-neutral-500 mt-4">
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
