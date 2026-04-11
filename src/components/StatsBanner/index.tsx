import { Trans } from "react-i18next";
import { motion } from "framer-motion";

export default function StatsBanner() {
  return (
    <section className="w-full py-4 lg:py-4">
      <motion.p
        className="font-heading font-extrabold text-[28px] leading-[32px] lg:text-[40px] lg:leading-[40px] text-neutral-800 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Trans
          i18nKey="statsBanner.text"
          components={{ 1: <span className="text-cta-main" /> }}
        />
      </motion.p>
    </section>
  );
}
