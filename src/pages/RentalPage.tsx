import { useTranslation } from "react-i18next";
import WizardPage from "../components/WizardPage";

export default function RentalPage() {
  const { t } = useTranslation();

  return (
    <WizardPage
      pageKey="rental"
      breadcrumbLabel={t("buttons.rental")}
      heroTitle={t("wizard.rental.title")}
    />
  );
}
