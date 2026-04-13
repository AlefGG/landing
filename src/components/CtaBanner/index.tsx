import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button, Modal, ContactForm } from "../ui";

export default function CtaBanner() {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className="relative w-full min-h-[424px] overflow-hidden" id="cta">
        {/* Dark gradient bg + city overlay image */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#3c4449] to-[#21272b]" />
          <img
            alt=""
            className="absolute inset-0 size-full object-cover mix-blend-overlay opacity-50"
            src="/assets/images/cta-bg.png"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <motion.div
          className="relative max-w-[1216px] mx-auto px-7 lg:px-0 h-full flex items-center lg:items-end py-[72px] lg:py-[152px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-16 lg:gap-8 w-full text-center lg:text-left">
            {/* Left: heading */}
            <h2 className="font-heading font-semibold lg:font-extrabold text-[32px] leading-[32px] lg:text-[56px] lg:leading-[56px] text-white max-w-[486px]">
              {t("cta.title")}
            </h2>

            {/* Right: subtitle + button */}
            <div className="flex flex-col items-center gap-6 shrink-0">
              <p className="font-sans lg:font-heading font-semibold lg:font-extrabold text-[16px] leading-[24px] lg:text-[24px] lg:leading-[24px] text-white text-center max-w-[384px]">
                {t("cta.subtitle")}
              </p>
              <Button
                variant="cta"
                size="md"
                className="rounded-[40px] px-10 py-3 w-[272px] justify-center"
                onClick={() => setModalOpen(true)}
              >
                {t("cta.button")}
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ContactForm onSuccess={() => setTimeout(() => setModalOpen(false), 2000)} />
      </Modal>
    </>
  );
}
