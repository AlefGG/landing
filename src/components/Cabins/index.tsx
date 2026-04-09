import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { SectionTitle, Tag, Button } from "../ui";

const cabins = [
  { key: "standard", image: "/assets/images/cabin-standard.png" },
  { key: "lux", image: "/assets/images/cabin-lux.png" },
  { key: "vip", image: "/assets/images/cabin-vip.png" },
] as const;

export default function Cabins() {
  const { t } = useTranslation();

  return (
    <section className="w-full py-16 lg:py-24" id="cabins">
      <div className="max-w-[1216px] mx-auto px-4 lg:px-8">
        <SectionTitle>{t("cabins.title")}</SectionTitle>
        <p className="font-body text-base text-neutral-500 text-center mt-4 max-w-[800px] mx-auto">
          {t("cabins.subtitle")}
        </p>

        <div className="flex lg:grid lg:grid-cols-3 gap-8 mt-10 overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-4 lg:pb-0">
          {cabins.map((cabin, i) => (
            <motion.div
              key={cabin.key}
              className="relative bg-white rounded-3xl border border-neutral-200 p-0 min-w-[300px] lg:min-w-0 snap-center flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{
                y: -4,
                boxShadow: "0px 8px 20px 0px rgba(94,117,138,0.18)",
              }}
            >
              {/* Tag */}
              <div className="absolute top-2 right-2 z-10">
                <Tag className="bg-cta-main/10 text-cta-main">
                  {t(`cabins.${cabin.key}.tag`)}
                </Tag>
              </div>

              {/* Photo */}
              <div className="flex justify-center pt-6 px-10">
                <img
                  src={cabin.image}
                  alt={t(`cabins.${cabin.key}.name`)}
                  className="h-[248px] w-auto object-contain"
                  loading="lazy"
                />
              </div>

              {/* Info */}
              <div className="p-6 pt-4 flex flex-col flex-1">
                <h4 className="font-heading font-bold text-xl text-neutral-800">
                  {t(`cabins.${cabin.key}.name`)}
                </h4>
                <p className="font-body text-base text-neutral-600 mt-1">
                  {t(`cabins.${cabin.key}.price`)}
                </p>

                {/* Features */}
                <ul className="mt-4 flex flex-col gap-1 flex-1">
                  {(
                    t(`cabins.${cabin.key}.features`, {
                      returnObjects: true,
                    }) as string[]
                  ).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm font-body text-neutral-700"
                    >
                      <img
                        src="/assets/icons/check.svg"
                        alt=""
                        className="w-4 h-4 mt-0.5 shrink-0"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Buttons */}
                <div className="flex gap-4 mt-6">
                  <Button variant="cta" size="sm" href="#" className="flex-1">
                    {t("buttons.buy")}
                  </Button>
                  <Button variant="ghost" size="sm" href="#" className="flex-1">
                    {t("buttons.rent")}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
