import { useTranslation } from "react-i18next";
import WizardPage from "../components/WizardPage";

export default function SanitationPage() {
  const { t } = useTranslation();

  return (
    <WizardPage
      pageKey="sanitation"
      breadcrumbLabel={t("buttons.sanitation")}
      heroTitle={t("wizard.sanitation.title")}
      warning={t("wizard.sanitation.warning")}
    />
  );
}
