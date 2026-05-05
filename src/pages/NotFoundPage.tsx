import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <>
      <Seo pageKey="notFound" noindex />
      <section
        className="max-w-[1216px] mx-auto px-4 lg:px-8 py-16 lg:py-[104px] flex flex-col items-center text-center gap-6"
        data-testid="not-found-page"
      >
        <p className="font-heading font-extrabold text-[96px] leading-none text-cta-main">
          404
        </p>
        <h1 className="font-heading font-extrabold text-3xl lg:text-[40px] leading-tight text-neutral-900">
          {t("notFound.title")}
        </h1>
        <p className="font-body text-lg leading-7 text-neutral-600 max-w-[520px]">
          {t("notFound.description")}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-3 bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white font-body font-semibold text-base leading-6 rounded-[40px] pl-8 pr-6 py-3"
        >
          {t("notFound.homeCta")}
        </Link>
      </section>
    </>
  );
}
