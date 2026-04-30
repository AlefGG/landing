import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button, LanguageSwitcher } from "../ui";
import { useAuth } from "../../contexts/AuthContext";
import { formatPhone } from "../wizards/shared/phoneFormat";

export default function Header() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, status, logout } = useAuth();

  useEffect(() => {
    if (!accountMenuOpen) return;
    function onClick(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [accountMenuOpen]);

  const handleLogout = () => {
    logout();
    setAccountMenuOpen(false);
    setMenuOpen(false);
    navigate("/");
  };
  const navLinks = [
    { label: t("nav.about"), href: "#about" },
    { label: t("nav.advantages"), href: "#advantages" },
    { label: t("nav.cabins"), href: "#cabins" },
  ];

  const activePath = location.pathname.startsWith("/sale")
    ? "/sale"
    : location.pathname.startsWith("/service") ||
      location.pathname.startsWith("/sanitation")
    ? "/service"
    : location.pathname.startsWith("/rental")
    ? "/rental"
    : null;
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
            className="flex items-center gap-1 text-sm font-semibold font-body text-[#0F7A37]"
            aria-label="WhatsApp"
          >
            {t("nav.whatsapp")}
            <img src="/assets/icons/whatsapp.svg" alt="" className="w-8 h-8" />
          </a>
          {status === "authenticated" && user ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-1 text-sm font-semibold font-body text-neutral-700 hover:text-neutral-900"
                data-testid="header-account-button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
                {formatPhone(user.phone)}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
              {accountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1 min-w-[200px] rounded-[8px] border border-neutral-200 bg-white shadow-lg z-50 overflow-hidden"
                >
                  <Link
                    to="/account/orders"
                    role="menuitem"
                    onClick={() => setAccountMenuOpen(false)}
                    className="block px-4 py-3 font-body text-sm leading-4 text-neutral-800 hover:bg-neutral-100"
                    data-testid="header-my-orders-link"
                  >
                    {t("auth.header.myOrders")}
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 font-body text-sm leading-4 text-neutral-800 hover:bg-neutral-100 border-t border-neutral-100"
                    data-testid="header-logout-button"
                  >
                    {t("auth.header.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 text-sm font-semibold font-body text-neutral-700 hover:text-neutral-900"
              data-testid="header-login-link"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
              {t("nav.login")}
            </Link>
          )}
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="sticky top-0 z-40">
        <div className="max-w-[1216px] mx-auto px-3 lg:px-8 flex items-center h-10 lg:h-16">
          {/* Logo */}
          <Link
            to="/"
            className="shrink-0 flex items-center gap-2"
            aria-label={t("meta.brandName")}
          >
            <img
              src="/assets/logos/logo-icon.svg"
              alt=""
              aria-hidden="true"
              className="h-8 w-auto lg:h-11"
            />
            <span
              className="flex flex-col text-neutral-900 text-[15px] lg:text-[18px] leading-[1.05] tracking-[-0.01em]"
              style={{ fontFamily: '"Geologica", "Nunito Sans", sans-serif', fontWeight: 400 }}
            >
              <span>Эко</span>
              <span>Ресурс</span>
            </span>
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
          <div className="hidden lg:flex w-[494px] shrink-0 items-center gap-4">
            <div className="flex-1">
              <Button variant={variantFor("/sale")} size="md" href="/sale" className="w-full">
                {t("buttons.sale")}
              </Button>
            </div>
            <div className="flex-1">
              <Button variant={variantFor("/service")} size="md" href="/service" className="w-full">
                {t("buttons.service")}
              </Button>
            </div>
            <div className="flex-1">
              <Button variant={variantFor("/rental")} size="md" href="/rental" className="w-full">
                {t("buttons.rental")}
              </Button>
            </div>
          </div>

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
          <Button variant={variantFor("/rental")} size="sm" href="/rental" className="rounded-[40px] flex-1 whitespace-nowrap">
            {t("buttons.rental")}
          </Button>
          <Button variant={variantFor("/service")} size="sm" href="/service" className="flex-1 whitespace-nowrap">
            {t("buttons.service")}
          </Button>
          <Button variant={variantFor("/sale")} size="sm" href="/sale" className="flex-1 whitespace-nowrap">
            {t("buttons.sale")}
          </Button>
        </div>

        {/* Mobile language switcher — BUG-004: must be reachable without burger */}
        <div className="lg:hidden flex justify-end px-3 pt-3">
          <LanguageSwitcher />
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
              <Button variant={variantFor("/service")} size="md" href="/service" className="w-full">
                {t("buttons.service")}
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
              {status === "authenticated" && user ? (
                <>
                  <li className="border-b border-neutral-200 flex items-center justify-between">
                    <span className="flex items-center gap-2 py-2 pl-2 text-neutral-900 text-base leading-6 font-body">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-800" aria-hidden="true">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                      </svg>
                      {formatPhone(user.phone)}
                    </span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="py-2 pr-2 font-body text-base leading-6 text-cta-main"
                      data-testid="header-logout-mobile"
                    >
                      {t("auth.header.logout")}
                    </button>
                  </li>
                  <li className="border-b border-neutral-200">
                    <Link
                      to="/account/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 py-2 pl-2 text-neutral-900 text-base leading-6 font-body"
                      data-testid="header-my-orders-mobile"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-800" aria-hidden="true">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <path d="M8 9h8M8 13h8M8 17h5" />
                      </svg>
                      {t("auth.header.myOrders")}
                    </Link>
                  </li>
                </>
              ) : (
                <li className="border-b border-neutral-200">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 py-2 pl-2 text-neutral-900 text-base leading-6 font-body"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-800" aria-hidden="true">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                    {t("nav.login")}
                  </Link>
                </li>
              )}
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
