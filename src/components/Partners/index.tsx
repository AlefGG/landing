import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { SectionTitle } from "../ui";

const partners = [
  { name: "Everest Development", logo: "/assets/logos/partner-everest.svg" },
  { name: "Kusto Group", logo: "/assets/logos/partner-kusto.png" },
  { name: "RAM Construction", logo: "/assets/logos/partner-ram.png" },
  { name: "Dial Stroy", logo: "/assets/logos/partner-dialstroy.svg" },
  { name: "Hayat Construction", logo: "/assets/logos/partner-hayat.svg" },
];

export default function Partners() {
  const { t } = useTranslation();

  return (
    <section className="w-full py-16 lg:py-24">
      <div className="max-w-[1216px] mx-auto px-4 lg:px-8">
        <SectionTitle>{t("partners.title")}</SectionTitle>

        <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 mt-10">
          {partners.map((partner, i) => (
            <motion.div
              key={partner.name}
              className="flex items-center justify-center h-16 w-32 lg:w-44"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="max-h-full max-w-full object-contain grayscale hover:grayscale-0 transition-all"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
