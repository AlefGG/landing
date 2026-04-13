import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Tag, Button } from "../ui";

const cabins = [
  { key: "standard", image: "/assets/images/cabin-standard.png" },
  { key: "lux", image: "/assets/images/cabin-lux.png" },
  { key: "vip", image: "/assets/images/cabin-vip.png" },
] as const;

export default function Cabins() {
  const { t } = useTranslation();

  return (
    <section className="w-full bg-[#efefef] py-[88px]" id="cabins">
      <div className="max-w-[1216px] mx-auto px-4 lg:px-0">
        <h2 className="font-heading font-extrabold text-2xl leading-6 lg:text-[40px] lg:leading-[40px] text-neutral-800 text-left lg:text-center">
          {t("cabins.title1")}
          <span className="text-cta-main">{t("cabins.titleHighlight")}</span>
        </h2>
        <p className="font-body text-base lg:text-xl leading-6 text-neutral-700 text-left lg:text-center mt-8 whitespace-pre-line">
          {t("cabins.subtitle")}
        </p>

        <div className="mt-8 flex flex-col lg:grid lg:grid-cols-3 gap-8 lg:pb-0">
          {cabins.map((cabin, i) => (
            <motion.div
              key={cabin.key}
              className="relative bg-white rounded-[24px] w-full flex flex-col items-center px-6 sm:px-10 pt-6 pb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{
                y: -4,
                boxShadow: "0px 8px 20px 0px rgba(94,117,138,0.18)",
              }}
            >
              {/* Tag — top-right */}
              <div className="absolute top-2 right-2 z-10">
                <Tag>{t(`cabins.${cabin.key}.tag`)}</Tag>
              </div>

              {/* Top content: photo + text */}
              <div className="flex flex-col items-center gap-6 w-full">
                {/* Photo */}
                <img
                  src={cabin.image}
                  alt={t(`cabins.${cabin.key}.name`)}
                  width={150}
                  height={252}
                  className="h-[252px] w-[150px] object-contain"
                  loading="lazy"
                />

                {/* Info block */}
                <div className="flex flex-col gap-4 w-full">
                  {/* Title + price */}
                  <div className="text-center text-neutral-800 w-full">
                    <h3 className="font-heading font-extrabold text-2xl leading-6">
                      {t(`cabins.${cabin.key}.name`)}
                    </h3>
                    <p className="font-body font-semibold text-base leading-6">
                      {t(`cabins.${cabin.key}.price`)}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col w-full">
                    {(
                      t(`cabins.${cabin.key}.features`, {
                        returnObjects: true,
                      }) as string[]
                    ).map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-1 font-body font-normal text-sm leading-4 text-neutral-500"
                      >
                        <img
                          src="/assets/icons/check.svg"
                          alt=""
                          width={16}
                          height={16}
                          className="w-4 h-4 shrink-0"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 w-full mt-auto pt-6">
                <Button
                  variant="blue-ghost"
                  size="sm"
                  href="#"
                  className="flex-1 h-8"
                >
                  {t("buttons.buy")}
                </Button>
                <Button
                  variant="blue"
                  size="sm"
                  href="#"
                  className="flex-1 h-8"
                >
                  {t("buttons.rent")}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
