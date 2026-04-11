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
    <section className="w-full py-10 lg:pt-10 lg:pb-[88px]" id="services">
      <div className="max-w-[1216px] mx-auto px-4 lg:px-0">
        <div className="flex flex-col lg:flex-row items-stretch gap-4">
          {services.map((service, i) => {
            const isActive = i === services.length - 1;
            return (
              <div key={service.key} className="flex flex-col lg:flex-row flex-1">
                {i > 0 && (
                  <>
                    <div className="hidden lg:block w-px bg-neutral-300 self-stretch" />
                    <div className="lg:hidden h-px bg-neutral-200 my-6" />
                  </>
                )}
                <motion.div
                  className={`flex flex-col items-center text-center px-8 py-10 rounded-3xl flex-1 transition-shadow ${
                    isActive ? "shadow-[0px_8px_20px_0px_rgba(94,117,138,0.18)]" : ""
                  }`}
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
                    width={104}
                    height={104}
                    className="w-[104px] h-[104px] mb-6"
                  />
                  <h3 className="font-heading font-extrabold text-2xl leading-6 text-neutral-800">
                    {t(`services.${service.key}.title`)}
                  </h3>
                  <p className="font-body font-semibold text-base leading-6 text-neutral-800 mt-2">
                    {t(`services.${service.key}.subtitle`)}
                  </p>
                  <p className="font-body text-base leading-6 text-neutral-500 mt-4">
                    {t(`services.${service.key}.description`)}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
