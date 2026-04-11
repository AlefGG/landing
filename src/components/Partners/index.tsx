import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const partners: { name: string; logo: string; opacity?: number }[] = [
  { name: "Everest Development", logo: "/assets/logos/partner-everest.svg" },
  { name: "Kusto Group", logo: "/assets/logos/partner-kusto.png" },
  { name: "RAM Construction", logo: "/assets/logos/partner-ram.png", opacity: 0.6 },
  { name: "Everest Development 2", logo: "/assets/logos/partner-everest.svg" },
  { name: "Kusto Group 2", logo: "/assets/logos/partner-kusto.png" },
];

export default function Partners() {
  const { t } = useTranslation();

  return (
    <section id="partners" className="w-full py-16 lg:py-[88px]">
      <div className="max-w-[1216px] mx-auto px-4 lg:px-0 flex flex-col items-center gap-8">
        <h2 className="font-heading font-extrabold text-[32px] leading-[36px] lg:text-[40px] lg:leading-[40px] text-neutral-800 text-center">
          {t("partners.title1")}
          <span className="text-cta-main">{t("partners.titleHighlight")}</span>
          {t("partners.title2")}
        </h2>

        <div className="flex flex-wrap justify-center items-start gap-4 lg:gap-8">
          {partners.map((partner, i) => (
            <motion.div
              key={partner.name}
              className="flex flex-col items-center justify-center px-4 py-6 lg:px-8 lg:py-10 rounded-3xl"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-10 lg:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all"
                style={partner.opacity ? { opacity: partner.opacity } : undefined}
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
