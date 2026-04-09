import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggle = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  return (
    <div className="flex items-center gap-1 text-sm font-body">
      <button
        onClick={() => toggle("ru")}
        className={`px-2 py-1 rounded transition-colors ${
          currentLang === "ru"
            ? "text-cta-main font-semibold"
            : "text-neutral-600 hover:text-neutral-800"
        }`}
      >
        RU
      </button>
      <span className="text-neutral-300">|</span>
      <button
        onClick={() => toggle("kz")}
        className={`px-2 py-1 rounded transition-colors ${
          currentLang === "kz"
            ? "text-cta-main font-semibold"
            : "text-neutral-600 hover:text-neutral-800"
        }`}
      >
        KZ
      </button>
    </div>
  );
}
