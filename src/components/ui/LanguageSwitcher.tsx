import { useTranslation } from "react-i18next";

type Lang = { code: "ru" | "kk"; label: string };

const LANGS: readonly Lang[] = [
  { code: "ru", label: "RU" },
  { code: "kk", label: "KZ" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggle = (lang: Lang["code"]) => {
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang);
    }
  };

  return (
    <div className="flex items-center gap-1 text-sm font-body" role="group" aria-label="Language">
      {LANGS.map((lang, i) => {
        const active = currentLang === lang.code;
        return (
          <span key={lang.code} className="contents">
            {i > 0 && (
              <span aria-hidden="true" className="text-neutral-300">
                |
              </span>
            )}
            <button
              type="button"
              onClick={() => toggle(lang.code)}
              aria-pressed={active}
              lang={lang.code}
              className={`px-2 py-1 rounded transition-colors ${
                active ? "text-cta-main font-semibold" : "text-neutral-600 hover:text-neutral-800"
              }`}
            >
              {lang.label}
            </button>
          </span>
        );
      })}
    </div>
  );
}
