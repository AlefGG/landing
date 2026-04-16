import { useTranslation } from "react-i18next";
import WizardPage from "../components/WizardPage";

export default function SalePage() {
  const { t } = useTranslation();

  return (
    <WizardPage
      pageKey="sale"
      breadcrumbLabel={t("buttons.sale")}
      heroTitle={t("wizard.sale.title")}
    />
  );
}
