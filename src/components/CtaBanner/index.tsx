import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button, Modal, ContactForm } from "../ui";

export default function CtaBanner() {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className="w-full py-16 lg:py-24">
        <motion.div
          className="max-w-[1216px] mx-auto px-4 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-gradient-to-br from-cta-gradient-from to-cta-gradient-to rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="font-heading font-extrabold text-[28px] lg:text-[40px] text-white">
                {t("cta.title")}
              </h2>
              <p className="font-body text-base lg:text-lg text-white/80 mt-3">
                {t("cta.subtitle")}
              </p>
              <Button
                variant="ghost"
                size="md"
                className="mt-6 border-white text-white hover:bg-white/10"
                onClick={() => setModalOpen(true)}
              >
                {t("cta.button")}
              </Button>
            </div>
            <div className="hidden lg:block shrink-0">
              <img
                src="/assets/images/cabin-standard.png"
                alt=""
                className="h-[280px] w-auto object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </motion.div>
      </section>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ContactForm
          onSuccess={() => setTimeout(() => setModalOpen(false), 2000)}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </>
  );
}
