import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import kk from "./locales/kk.json";

const STORAGE_KEY = "lang";
const SUPPORTED = ["ru", "kk"] as const;
type Supported = (typeof SUPPORTED)[number];

function resolveInitialLang(): Supported {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    const queryLang = url.searchParams.get("lang");
    if (queryLang === "kk" || queryLang === "ru") return queryLang;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  // Migrate legacy "kz" → "kk"
  if (stored === "kz") {
    localStorage.setItem(STORAGE_KEY, "kk");
    return "kk";
  }
  if (stored && (SUPPORTED as readonly string[]).includes(stored)) {
    return stored as Supported;
  }
  return "ru";
}

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    kk: { translation: kk },
  },
  lng: resolveInitialLang(),
  fallbackLng: "ru",
  supportedLngs: SUPPORTED,
  interpolation: { escapeValue: false },
  returnNull: false,
});

// Cross-tab sync: another tab changed the language → apply it here.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue && (SUPPORTED as readonly string[]).includes(e.newValue)) {
      if (i18n.language !== e.newValue) {
        i18n.changeLanguage(e.newValue);
      }
    }
  });

  // Persist any programmatic language change.
  i18n.on("languageChanged", (lng) => {
    if ((SUPPORTED as readonly string[]).includes(lng)) {
      localStorage.setItem(STORAGE_KEY, lng);
      // Update URL ?lang= so reload / share-link preserves locale.
      const url = new URL(window.location.href);
      if (url.searchParams.get("lang") !== lng) {
        url.searchParams.set("lang", lng);
        history.replaceState(null, "", url.toString());
      }
    }
  });
}

export default i18n;
