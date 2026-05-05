import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function WizardHero({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <section className="relative h-[104px] lg:h-[176px]">
      <div
        className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-[1216px] h-[712px] pointer-events-none"
        style={{ top: "-64px" }}
        aria-hidden="true"
      >
        <img src="/assets/images/wizard-hero-shape.svg" alt="" className="w-full h-full" />
      </div>
      <div
        className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#f1f1f1] to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-[1216px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-0.5 text-xs font-body mb-2 lg:mb-8">
          <Link to="/" className="text-link underline leading-4 text-xs px-[10px] py-[8px]">
            {t("wizard.rental.breadcrumbHome")}
          </Link>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-neutral-500" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-neutral-500 leading-4 text-xs px-[10px] py-[8px]">{title}</span>
        </nav>

        <h1 className="font-heading text-[32px] lg:text-[56px] font-extrabold leading-[32px] lg:leading-[56px] text-cta-main">
          {title}
        </h1>
      </div>

      <p
        className="hidden lg:block absolute right-[230px] top-[100px] font-heading text-[144px] font-extrabold leading-[56px] pointer-events-none select-none"
        style={{
          color: "transparent",
          WebkitTextStroke: "1.5px rgba(89, 176, 2, 0.15)",
        }}
        aria-hidden="true"
      >
        {title}
      </p>
    </section>
  );
}
