import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button, LanguageSwitcher } from "../ui";

export default function Header() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const navLinks = [
    { label: t("nav.about"), href: "#about" },
    { label: t("nav.advantages"), href: "#advantages" },
    { label: t("nav.cabins"), href: "#cabins" },
  ];

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  return (
    <header className="w-full">
      {/* Top bar */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-[1216px] mx-auto px-4 lg:px-8 flex items-center justify-end h-12 gap-8">
          <a
            href="tel:+77025672091"
            className="flex items-center gap-1 text-sm font-semibold font-body text-neutral-500"
          >
            {t("nav.phone")}
            <img src="/assets/icons/phone.svg" alt="" className="w-6 h-6" />
          </a>
          <a
            href="https://wa.me/77025672091"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-semibold font-body text-[#25D366]"
            aria-label="WhatsApp"
          >
            {t("nav.whatsapp")}
            <img src="/assets/icons/whatsapp.svg" alt="" className="w-8 h-8" />
          </a>
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1216px] mx-auto px-4 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="shrink-0" aria-label={t("meta.brandName")}>
            <img
              src="/assets/logos/logo.svg"
              alt={t("a11y.brandLogo")}
              className="h-12 w-auto"
            />
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="flex items-center gap-1 text-sm font-body text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                {link.label}
                <img
                  src="/assets/icons/chevron-down.svg"
                  alt=""
                  className="w-4 h-4"
                />
              </button>
            ))}
          </div>

          {/* Desktop CTA buttons */}
          <motion.div
            className="hidden lg:flex items-center gap-6"
            initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.8, duration: 0.4 }}
          >
            <Button variant="ghost" size="md" href="#">
              {t("buttons.sale")}
            </Button>
            <Button variant="ghost" size="md" href="#">
              {t("buttons.sanitation")}
            </Button>
            <Button variant="cta" size="md" href="#">
              {t("buttons.rental")}
            </Button>
          </motion.div>

          {/* Mobile burger */}
          <button
            type="button"
            className="lg:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t("a11y.closeMenu") : t("a11y.openMenu")}
          >
            <img src="/assets/icons/menu.svg" alt="" className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : undefined}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              id="mobile-menu"
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-50 p-6 flex flex-col gap-6 lg:hidden"
              initial={prefersReducedMotion ? { x: 0 } : { x: "100%" }}
              animate={{ x: 0 }}
              exit={prefersReducedMotion ? { x: 0 } : { x: "100%" }}
              transition={prefersReducedMotion ? { duration: 0 } : { type: "tween", duration: 0.3 }}
            >
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="self-end text-neutral-500"
                aria-label={t("a11y.closeMenu")}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollTo(link.href)}
                    className="text-left text-base font-body text-neutral-700 hover:text-cta-main transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Button variant="ghost" size="md" href="#">
                  {t("buttons.sale")}
                </Button>
                <Button variant="ghost" size="md" href="#">
                  {t("buttons.sanitation")}
                </Button>
                <Button variant="cta" size="md" href="#">
                  {t("buttons.rental")}
                </Button>
              </div>

              <LanguageSwitcher />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
