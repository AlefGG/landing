import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { SectionTitle } from "../ui";

const events = [
  { key: "athletics", icon: "/assets/icons/icon-athletics.svg" },
  { key: "marathons", icon: "/assets/icons/icon-marathons.svg" },
  { key: "festivals", icon: "/assets/icons/icon-festivals.svg" },
] as const;

export default function Events() {
  const { t } = useTranslation();

  return (
    <section className="w-full py-16 lg:py-24">
      <div className="max-w-[1216px] mx-auto px-4 lg:px-8">
        <SectionTitle>{t("events.title")}</SectionTitle>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
          {events.map((event, i) => (
            <motion.div
              key={event.key}
              className="flex flex-col items-center text-center px-8 py-10 rounded-3xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <img
                src={event.icon}
                alt=""
                className="w-[104px] h-[104px] mb-6"
                loading="lazy"
              />
              <h4 className="font-heading font-extrabold text-[20px] lg:text-[24px] text-neutral-800">
                {t(`events.${event.key}`)}
              </h4>
              {event.key === "festivals" && (
                <p className="font-body text-base text-neutral-600 mt-2">
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
