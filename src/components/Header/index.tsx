import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button, LanguageSwitcher } from "../ui";

export default function Header() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const location = useLocation();
  const navLinks = [
    { label: t("nav.about"), href: "#about" },
    { label: t("nav.advantages"), href: "#advantages" },
    { label: t("nav.cabins"), href: "#cabins" },
  ];

  const activePath = location.pathname.startsWith("/sale")
    ? "/sale"
    : location.pathname.startsWith("/sanitation")
    ? "/sanitation"
    : "/rental";
  const variantFor = (path: string) => (activePath === path ? "cta" : "ghost");

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    if (location.pathname !== "/") {
      navigate("/" + href);
      return;
    }
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  return (
    <header className="w-full">
      {/* Top bar — phone + whatsapp + lang (desktop only) */}
      <div className="hidden lg:block bg-white">
        <div className="max-w-[1216px] mx-auto px-4 lg:px-8 flex items-center justify-end h-12 gap-8">
          <a
            href="tel:+77025672091"
            className="flex items-center gap-1 text-sm font-semibold font-body text-neutral-500"
          >
            {t("nav.phone")}
            <img src="/assets/icons/copy.svg" alt="" className="w-6 h-6" />
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
      <nav className="sticky top-0 z-40">
        <div className="max-w-[1216px] mx-auto px-3 lg:px-8 flex items-center h-10 lg:h-16">
          {/* Logo */}
          <Link to="/" className="shrink-0" aria-label={t("meta.brandName")}>
            <img
              src="/assets/logos/logo.svg"
              alt={t("a11y.brandLogo")}
              className="h-10 w-auto lg:h-12"
            />
          </Link>

          {/* Desktop nav — space-between in left zone */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="flex items-center gap-1 text-sm font-body font-normal text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                {link.label}
                <img
                  src="/assets/icons/arrow-down.svg"
                  alt=""
                  className="w-4 h-4"
                />
              </button>
            ))}
          </div>

          {/* Desktop CTA buttons — aligned to gray SVG zone (accounting for px-8 padding) */}
          <motion.div
            className="hidden lg:flex w-[494px] shrink-0 items-center gap-4"
            initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.8, duration: 0.4 }}
          >
            <div className="flex-1">
              <Button variant={variantFor("/sale")} size="md" href="/sale" className="w-full">
                {t("buttons.sale")}
              </Button>
            </div>
            <div className="flex-1">
              <Button variant={variantFor("/sanitation")} size="md" href="/sanitation" className="w-full">
                {t("buttons.sanitation")}
              </Button>
            </div>
            <div className="flex-1">
              <Button variant={variantFor("/rental")} size="md" href="/rental" className="w-full">
                {t("buttons.rental")}
              </Button>
            </div>
          </motion.div>

          {/* Mobile phone + whatsapp + burger */}
          <div className="flex lg:hidden items-center gap-4 ml-auto">
            <a
              href="tel:+77025672091"
              className="flex items-center gap-1 text-[13px] leading-4 font-semibold font-body text-neutral-800"
            >
              <img src="/assets/icons/phone.svg" alt="" className="w-6 h-6" />
              {t("nav.phone")}
            </a>
            <a
              href="https://wa.me/77025672091"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="shrink-0"
            >
              <img src="/assets/icons/whatsapp.svg" alt="" className="w-8 h-8" />
            </a>
            <button
              type="button"
              className="shrink-0"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t("a11y.closeMenu") : t("a11y.openMenu")}
            >
              <img src="/assets/icons/menu.svg" alt="" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile sub-nav buttons */}
        <div className="lg:hidden flex items-center justify-between px-3 pt-6 pb-0 gap-2">
          <Button variant={variantFor("/rental")} size="sm" href="/rental" className="rounded-[40px] w-[94px]">
            {t("buttons.rental")}
          </Button>
          <Button variant={variantFor("/sanitation")} size="sm" href="/sanitation" className="w-[128px]">
            {t("buttons.sanitation")}
          </Button>
          <Button variant={variantFor("/sale")} size="sm" href="/sale" className="w-[100px]">
            {t("buttons.sale")}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 bg-white z-50 flex flex-col overflow-y-auto lg:hidden"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: "100%" }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: "tween", duration: 0.25 }}
          >
            {/* Close row */}
            <div className="flex items-center justify-end h-10 px-3">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-1 text-neutral-500 text-[13px] leading-4 font-body"
                aria-label={t("a11y.closeMenu")}
              >
                {t("nav.close")}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </button>
            </div>

            {/* Phone + WhatsApp */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <a
                href="tel:+77025672091"
                className="flex items-center gap-1 text-neutral-800 text-[20px] leading-6 font-semibold font-body"
              >
                <img src="/assets/icons/phone.svg" alt="" className="w-8 h-8" />
                {t("nav.phone")}
              </a>
              <a
                href="https://wa.me/77025672091"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="shrink-0"
              >
                <img src="/assets/icons/whatsapp.svg" alt="" className="w-10 h-10" />
              </a>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-4 px-6 pb-2">
              <Button variant={variantFor("/rental")} size="md" href="/rental" className="w-full">
                {t("buttons.rental")}
              </Button>
              <Button variant={variantFor("/sanitation")} size="md" href="/sanitation" className="w-full">
                {t("buttons.sanitation")}
              </Button>
              <Button variant={variantFor("/sale")} size="md" href="/sale" className="w-full">
                {t("buttons.sale")}
              </Button>
            </div>

            {/* Nav items with chevron */}
            <ul className="flex flex-col px-6 pt-2">
              {navLinks.map((link) => (
                <li key={link.href} className="border-b border-neutral-200 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => scrollTo(link.href)}
                    className="w-full flex items-center justify-between h-10 px-3 text-left text-neutral-900 text-base leading-6 font-body"
                  >
                    <span>{link.label}</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500" aria-hidden="true">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            {/* Login + Cart */}
            <ul className="flex flex-col px-6">
              <li className="border-b border-neutral-200">
                <a
                  href="/login"
                  className="flex items-center gap-2 py-2 pl-2 text-neutral-900 text-base leading-6 font-body"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-800" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                  </svg>
                  {t("nav.login")}
                </a>
              </li>
              <li>
                <a
                  href="/cart"
                  className="flex items-center gap-2 py-2 pl-2 text-neutral-900 text-base leading-6 font-body"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-800" aria-hidden="true">
                    <circle cx="9" cy="20" r="1.5" />
                    <circle cx="18" cy="20" r="1.5" />
                    <path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h8.6a2 2 0 002-1.6L21 8H6" />
                  </svg>
                  {t("nav.cart")}
                </a>
              </li>
            </ul>

            <div className="px-6 pt-6">
              <LanguageSwitcher />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
