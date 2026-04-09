import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function StatsBanner() {
  const { t } = useTranslation();

  return (
    <section className="w-full py-4 lg:py-6">
      <motion.p
        className="font-heading font-extrabold text-[28px] lg:text-[40px] text-cta-main text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {t("statsBanner.text")}
      </motion.p>
    </section>
  );
}
