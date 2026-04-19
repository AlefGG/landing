import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

const LOCALE_MAP: Record<string, string> = {
  ru: "ru_RU",
  kk: "kk_KZ",
};

type SeoProps = {
  pageKey?: string;
  titleOverride?: string;
  descriptionOverride?: string;
};

export default function Seo({ pageKey, titleOverride, descriptionOverride }: SeoProps = {}) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const lang = i18n.language in LOCALE_MAP ? i18n.language : "ru";
  const ogLocale = LOCALE_MAP[lang];

  const pageTitle = pageKey ? t(`meta.${pageKey}.title`, { defaultValue: "" }) : "";
  const pageDescription = pageKey ? t(`meta.${pageKey}.description`, { defaultValue: "" }) : "";

  const title = titleOverride || pageTitle || t("meta.title");
  const description = descriptionOverride || pageDescription || t("meta.description");

  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";
  const ogUrl = origin ? `${origin}${location.pathname}` : location.pathname;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:url" content={ogUrl} />
      {/* TODO: add real og:image file at /assets/og-image.png (1200x630) */}
      <meta property="og:image" content="/assets/og-image.png" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
