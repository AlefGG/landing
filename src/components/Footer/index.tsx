import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const socials = [
  { name: "Telegram", icon: "/assets/icons/social-telegram.svg", href: "#", bg: "bg-[#009eeb]" },
  { name: "VK", icon: "/assets/icons/social-vk.svg", href: "#", bg: "bg-[#0077ff]" },
  { name: "YouTube", icon: "/assets/icons/social-youtube.svg", href: "#", bg: "bg-[#ff0000]" },
];

function Divider() {
  return (
    <div className="hidden lg:block w-px self-stretch bg-neutral-200" />
  );
}

function MobileDivider() {
  return (
    <div className="lg:hidden h-px w-full bg-neutral-200" />
  );
}

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative bg-[#f8fafc] lg:bg-[#efefef] pt-[72px] lg:pt-[88px]">
      {/* Circular badge */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[40px] lg:top-[24px] z-10">
        <div className="bg-white rounded-full w-[64px] h-[64px] lg:w-[128px] lg:h-[128px] flex items-center justify-center shadow-[0px_5px_14px_0px_rgba(93,96,120,0.2)] lg:shadow-none">
          <img
            src="/assets/logos/footer-badge.svg"
            alt={t("a11y.brandLogo")}
            className="w-full h-full"
          />
        </div>
      </div>

      <div className="bg-[#f8fafc] lg:bg-white border-t border-neutral-200 pt-[48px] pb-[72px] px-6 lg:pt-[96px] lg:pb-[40px] lg:px-0">
        <div className="max-w-[1216px] mx-auto lg:px-0">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-4 items-start">
            {/* Description */}
            <div className="w-full lg:w-[280px] shrink-0">
              <p className="font-body text-sm leading-4 text-neutral-600">
                {t("footer.description")}
              </p>
            </div>

            <Divider />
            <MobileDivider />

            {/* Services */}
            <div className="flex flex-col gap-2 w-full lg:flex-1 lg:min-w-0">
              <Link
                to="/sale"
                className="font-body text-sm leading-4 text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                {t("buttons.sale")}
              </Link>
              <Link
                to="/service"
                className="font-body text-sm leading-4 text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                {t("buttons.service")}
              </Link>
              <Link
                to="/rental"
                className="inline-flex items-center justify-between w-[140px] bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white font-body font-semibold text-sm leading-4 rounded-[40px] px-4 py-1 whitespace-nowrap"
              >
                {t("buttons.rental")}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="-rotate-90" aria-hidden="true">
                  <path d="M4.5 6L8 9.5L11.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            <Divider />
            <MobileDivider />

            {/* Info links */}
            <div className="flex flex-col gap-2 w-full lg:w-[280px] shrink-0">
              <a href="#about" className="font-body text-sm leading-4 text-neutral-600 hover:text-neutral-800 transition-colors">
                {t("nav.about")}
              </a>
              <a href="#advantages" className="font-body text-sm leading-4 text-neutral-600 hover:text-neutral-800 transition-colors">
                {t("nav.advantages")}
              </a>
              <a href="#cabins" className="font-body text-sm leading-4 text-neutral-600 hover:text-neutral-800 transition-colors">
                {t("nav.cabins")}
              </a>
            </div>

            <Divider />
            <MobileDivider />

            {/* Contacts */}
            <div className="flex flex-col gap-2 w-full lg:w-[280px] shrink-0">
              <div className="flex gap-2">
                {socials.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    className="w-8 h-8"
                  >
                    <img src={s.icon} alt="" className="w-full h-full" />
                  </a>
                ))}
              </div>
              <a
                href="tel:+77025672091"
                className="font-body font-semibold text-base leading-6 text-neutral-600"
              >
                {t("nav.phone")}
              </a>
              <a
                href="mailto:info@eko-resurs.kz"
                className="font-body font-semibold text-base leading-6 text-neutral-600"
              >
                info@eko-resurs.kz
              </a>
            </div>
          </div>

          {/* Copyright */}
          <p className="font-body text-sm leading-4 text-neutral-500 text-center mt-8 lg:mt-12">
            {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
