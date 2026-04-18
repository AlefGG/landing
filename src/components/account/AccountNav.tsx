import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

export default function AccountNav() {
  const { t } = useTranslation();

  const base =
    "flex-1 lg:flex-none text-center lg:text-left px-4 py-3 font-body text-sm font-semibold rounded-lg transition-colors";
  const inactive = "text-neutral-700 hover:bg-neutral-100";
  const active = "bg-cta-main text-white";

  return (
    <nav
      aria-label={t("auth.account.title")}
      className="flex lg:flex-col gap-2 lg:w-[260px] lg:shrink-0"
      data-testid="account-nav"
    >
      <NavLink
        to="/account/orders"
        className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
        data-testid="account-nav-orders"
      >
        {t("auth.account.nav.orders")}
      </NavLink>
      <NavLink
        to="/account/profile"
        className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
        data-testid="account-nav-profile"
      >
        {t("auth.account.nav.profile")}
      </NavLink>
    </nav>
  );
}
