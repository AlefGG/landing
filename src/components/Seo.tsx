import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

const LOCALE_MAP: Record<string, string> = {
  ru: "ru_RU",
  kk: "kk_KZ",
};

export default function Seo() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language in LOCALE_MAP ? i18n.language : "ru";
  const ogLocale = LOCALE_MAP[lang];

  return (
    <Helmet>
      <html lang={lang} />
      <title>{t("meta.title")}</title>
      <meta name="description" content={t("meta.description")} />
      <meta property="og:title" content={t("meta.title")} />
      <meta property="og:description" content={t("meta.description")} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={ogLocale} />
      {/* TODO: add real og:image file at /assets/og-image.png (1200x630) */}
      <meta property="og:image" content="/assets/og-image.png" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
