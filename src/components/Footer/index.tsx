import { useTranslation } from "react-i18next";
import { Button } from "../ui";

const socials = [
  { name: "Telegram", icon: "/assets/icons/social-telegram.svg", href: "#" },
  { name: "VK", icon: "/assets/icons/social-vk.svg", href: "#" },
  { name: "YouTube", icon: "/assets/icons/social-youtube.svg", href: "#" },
];

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative bg-white border-t border-neutral-200 pt-24 pb-10">
      {/* Circular badge */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2">
        <div className="bg-white rounded-full p-2 shadow-md">
          <img
            src="/assets/logos/footer-badge.svg"
            alt="Эко-Ресурс"
            className="w-28 h-28"
          />
        </div>
      </div>

      <div className="max-w-[1216px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Description */}
          <div>
            <p className="font-body text-sm text-neutral-600 leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          {/* Services */}
          <div className="flex flex-col gap-2">
            <span className="font-body text-sm text-neutral-600">
              {t("buttons.sale")}
            </span>
            <span className="font-body text-sm text-neutral-600">
              {t("buttons.sanitation")}
            </span>
            <Button variant="cta" size="sm" href="#" className="w-fit">
              {t("buttons.rental")}
            </Button>
          </div>

          {/* Info links */}
          <div className="flex flex-col gap-2">
            <a href="#about" className="font-body text-sm text-neutral-600 hover:text-neutral-800 transition-colors">
              {t("nav.about")}
            </a>
            <a href="#advantages" className="font-body text-sm text-neutral-600 hover:text-neutral-800 transition-colors">
              {t("nav.advantages")}
            </a>
            <a href="#cabins" className="font-body text-sm text-neutral-600 hover:text-neutral-800 transition-colors">
              {t("nav.cabins")}
            </a>
          </div>

          {/* Contacts */}
          <div className="flex flex-col gap-3">
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
              className="font-body font-semibold text-base text-neutral-600"
            >
              {t("nav.phone")}
            </a>
            <a
              href="mailto:info@eko-resurs.kz"
              className="font-body font-semibold text-base text-neutral-600"
            >
              info@eko-resurs.kz
            </a>
          </div>
        </div>

        {/* Copyright */}
        <p className="font-body text-sm text-neutral-300 text-center mt-12">
          {t("footer.copyright")}
        </p>
      </div>
    </footer>
  );
}
