import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const events = [
  { key: "athletics", icon: "/assets/icons/icon-athletics.svg" },
  { key: "marathons", icon: "/assets/icons/icon-marathons.svg" },
  { key: "festivals", icon: "/assets/icons/icon-festivals.svg" },
] as const;

export default function Events() {
  const { t } = useTranslation();

  return (
    <section
      className="w-full bg-gradient-to-b from-neutral-800 to-[#21272b] py-[40px] lg:py-[88px]"
      id="events"
    >
      <div className="max-w-[1216px] mx-auto px-3 lg:px-0">
        <h2 className="font-heading font-semibold lg:font-extrabold text-[24px] leading-[24px] lg:text-[40px] lg:leading-[40px] text-white text-center">
          {t("events.title")}
        </h2>

        {/* Mobile: stacked horizontal cards */}
        <div className="flex flex-col lg:hidden mt-[32px]">
          {events.map((event) => (
            <div
              key={event.key}
              className="flex flex-row items-start justify-center gap-4 px-4 py-6"
            >
              <img
                src={event.icon}
                alt=""
                width={56}
                height={56}
                className="w-14 h-14 shrink-0 object-contain"
                loading="lazy"
              />
              <div className="flex flex-1 flex-col gap-2 min-w-0">
                <h3 className="font-body font-extrabold text-[16px] leading-[16px] text-white">
                  {t(`events.${event.key}`)}
                </h3>
                {event.key === "festivals" && (
                  <p className="font-body font-normal text-[13px] leading-4 text-neutral-200">
                    {t("events.festivalsSubtitle")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: 3-column grid */}
        <div className="hidden lg:grid grid-cols-3 gap-[32px] mt-[32px]">
          {events.map((event, i) => (
            <motion.div
              key={event.key}
              className="flex flex-col items-center text-center px-[32px] py-[56px] rounded-[24px]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <img
                src={event.icon}
                alt=""
                width={104}
                height={104}
                className="w-[104px] h-[104px]"
                loading="lazy"
              />
              <h3 className="font-heading font-extrabold text-[24px] leading-[24px] text-white mt-[24px]">
                {t(`events.${event.key}`)}
              </h3>
              {event.key === "festivals" && (
                <p className="font-body font-semibold text-[16px] leading-[24px] text-neutral-200 mt-[8px]">
                  {t("events.festivalsSubtitle")}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
