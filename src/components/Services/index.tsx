import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const services = [
  { key: "sale", icon: "/assets/icons/icon-sale.svg" },
  { key: "sanitation", icon: "/assets/icons/icon-sanitation.svg" },
  { key: "rental", icon: "/assets/icons/icon-rental.svg" },
] as const;

export default function Services() {
  const { t } = useTranslation();

  return (
    <section className="w-full py-10 lg:py-20">
      <div className="max-w-[1216px] mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row items-stretch">
          {services.map((service, i) => (
            <div key={service.key} className="flex flex-col lg:flex-row flex-1">
              {i > 0 && (
                <div className="hidden lg:block w-px bg-neutral-300 self-stretch mx-0" />
              )}
              {i > 0 && <div className="lg:hidden h-px bg-neutral-200 my-6" />}
              <motion.div
                className="flex flex-col items-center text-center px-8 py-10 rounded-3xl flex-1 transition-shadow"
                whileHover={{
                  y: -8,
                  boxShadow: "0px 8px 20px 0px rgba(94,117,138,0.18)",
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <img
                  src={service.icon}
                  alt=""
                  className="w-[104px] h-[104px] mb-6"
                />
                <h4 className="font-heading font-extrabold text-[20px] lg:text-[24px] text-neutral-800">
                  {t(`services.${service.key}.title`)}
                </h4>
                <p className="font-body font-semibold text-base text-neutral-800 mt-2">
                  {t(`services.${service.key}.subtitle`)}
                </p>
                <p className="font-body text-base text-neutral-500 mt-4">
                  {t(`services.${service.key}.description`)}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
