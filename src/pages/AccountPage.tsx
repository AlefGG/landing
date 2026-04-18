import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import Seo from "../components/Seo";
import AccountNav from "../components/account/AccountNav";

export default function AccountPage() {
  const { t } = useTranslation();

  return (
    <>
      <Seo pageKey="account" />
      <section className="bg-neutral-50 min-h-[60vh] py-8 lg:py-12">
        <div className="max-w-[1216px] mx-auto px-4 lg:px-8">
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-neutral-900 mb-6 lg:mb-8">
            {t("auth.account.title")}
          </h1>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            <AccountNav />
            <div className="flex-1 min-w-0">
              <Outlet />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
