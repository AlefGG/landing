import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const services = [
  { key: "sale", icon: "/assets/icons/icon-sale.svg", to: "/sale" },
  // PR-12: i18n key flipped to "service"; static asset path
  // /assets/icons/icon-sanitation.svg kept (asset rename out of scope).
  { key: "service", icon: "/assets/icons/icon-sanitation.svg", to: "/service" },
  { key: "rental", icon: "/assets/icons/icon-rental.svg", to: "/rental" },
] as const;

export default function Services() {
  const { t } = useTranslation();

  return (
    <section className="w-full pt-10 pb-[88px]" id="services" aria-labelledby="services-heading">
      <div className="max-w-[1216px] mx-auto px-3 lg:px-0">
        {/* Visually-hidden h2 to satisfy WCAG heading-order between Hero h1
            and the h3 service cards below; visible design intentionally has
            no header copy here (FE-A11Y-003). */}
        <h2 id="services-heading" className="sr-only">
          {t("services.heading")}
        </h2>
        {/* Mobile: horizontal items with dividers */}
        <div className="flex flex-col lg:hidden">
          {services.map((service, i) => (
            <div key={service.key}>
              {i > 0 && <div className="h-px bg-neutral-300 w-full" />}
              <Link
                to={service.to}
                className="flex flex-row items-start gap-4 py-4 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                <img
                  src={service.icon}
                  alt=""
                  className="w-16 h-16 shrink-0 object-contain"
                />
                <div className="flex flex-1 flex-col gap-2 min-w-0">
                  <h3 className="font-heading font-medium text-base leading-4 text-neutral-800">
                    {t(`services.${service.key}.title`)}
                  </h3>
                  <p className="font-body font-semibold text-[13px] leading-4 text-neutral-800">
                    {t(`services.${service.key}.subtitle`)}
                  </p>
                  <p className="font-body font-normal text-[13px] leading-4 text-neutral-600">
                    {t(`services.${service.key}.description`)}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Desktop: horizontal with dividers */}
        <div className="hidden lg:flex items-stretch gap-4">
          {services.map((service, i) => {
            return (
              <div key={service.key} className="contents">
                {i > 0 && (
                  <div className="w-px bg-neutral-300 self-stretch shrink-0" />
                )}
                <motion.div
                  className="flex-1"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                >
                  <Link
                    to={service.to}
                    className="flex flex-col items-center text-center px-8 py-10 rounded-3xl h-full hover:bg-neutral-50 transition-colors"
                  >
                    <img
                      src={service.icon}
                      alt=""
                      className="w-[104px] h-[104px] object-contain"
                    />
                    <div className="flex flex-col gap-4 mt-6 w-full">
                      <div className="flex flex-col gap-2 w-full">
                        <h3 className="font-heading font-extrabold text-2xl leading-6 text-neutral-800">
                          {t(`services.${service.key}.title`)}
                        </h3>
                        <p className="font-body font-semibold text-base leading-6 text-neutral-800">
                          {t(`services.${service.key}.subtitle`)}
                        </p>
                      </div>
                      <p className="font-body font-normal text-base leading-6 text-neutral-500">
                        {t(`services.${service.key}.description`)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
