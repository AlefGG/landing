import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const partners: { name: string; logo?: string | null }[] = [
  { name: "Everest Development", logo: "/assets/logos/partner-everest.svg" },
  { name: "Kusto Group", logo: "/assets/logos/partner-kusto.png" },
  { name: "RAMS Construction", logo: "/assets/logos/partner-ram.png" },
  { name: "BI Group", logo: null },
];

export default function Partners() {
  const { t } = useTranslation();

  return (
    <section id="clients" className="w-full pt-12 pb-6 lg:py-[88px]">
      <div className="max-w-[1216px] mx-auto px-3 lg:px-0 flex flex-col items-center gap-2 lg:gap-8">
        <h2 className="font-heading font-extrabold text-[24px] leading-[24px] lg:text-[40px] lg:leading-[40px] text-neutral-800 text-center">
          {t("partners.title1")}
          <span className="text-cta-main font-semibold lg:font-extrabold">{t("partners.titleHighlight")}</span>
          {t("partners.title2")}
        </h2>

        <div className="flex flex-wrap justify-center items-start gap-2 lg:gap-8 w-full">
          {partners.map((partner, i) => (
            <motion.div
              key={partner.name}
              className="flex flex-col items-center justify-center px-6 py-[30px] lg:px-8 lg:py-10 rounded-[18px] lg:rounded-3xl"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              {partner.logo ? (
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-[35px] lg:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all"
                  loading="lazy"
                />
              ) : (
                <span className="flex items-center justify-center h-[35px] lg:h-12 px-2 font-heading font-bold text-[18px] lg:text-[24px] text-neutral-400 whitespace-nowrap">
                  {partner.name}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
