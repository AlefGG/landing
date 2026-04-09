import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

export default function Seo() {
  const { t, i18n } = useTranslation();

  return (
    <Helmet>
      <html lang={i18n.language === "kz" ? "kk" : "ru"} />
      <title>{t("meta.title")}</title>
      <meta name="description" content={t("meta.description")} />
      <meta property="og:title" content={t("meta.title")} />
      <meta property="og:description" content={t("meta.description")} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={i18n.language === "kz" ? "kk_KZ" : "ru_RU"} />
    </Helmet>
  );
}
