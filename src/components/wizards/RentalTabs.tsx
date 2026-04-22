import { useState } from "react";
import { useTranslation } from "react-i18next";
import EventWizard from "./EventWizard";
import EmergencyWizard from "./EmergencyWizard";
import ConstructionWizard from "./ConstructionWizard";
import WizardHero from "./shared/WizardHero";
import { StepLabel, Separator, RadioRow } from "./shared";

type TabKey = "event" | "emergency" | "construction";

export default function RentalTabs() {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;
  const [tab, setTab] = useState<TabKey>("event");

  const options: { key: TabKey; label: string; description: string }[] = [
    {
      key: "event",
      label: t(`${k}.step1Event`),
      description: t(`${k}.step1EventDesc`),
    },
    {
      key: "construction",
      label: t(`${k}.step1Construction`),
      description: t(`${k}.step1ConstructionDesc`),
    },
    {
      key: "emergency",
      label: t(`${k}.step1Emergency`),
      description: t(`${k}.step1EmergencyDesc`),
    },
  ];

  return (
    <div className="bg-white overflow-x-clip">
      <WizardHero title={t(`${k}.title`)} />

      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6">
        <div
          className="lg:px-[104px]"
          role="radiogroup"
          aria-label={t(`${k}.step1Title`)}
        >
          <StepLabel step={1} title={t(`${k}.step1Title`)} />
          <div className="mt-8 lg:mt-4 lg:py-6 flex flex-col lg:flex-row gap-8 lg:gap-[72px]">
            {options.map(({ key, label, description }) => (
              <RadioRow
                key={key}
                selected={tab === key}
                onClick={() => setTab(key)}
                label={label}
                description={description}
                testId={`rental-tab-${key}`}
              />
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {tab === "event" && <EventWizard stepOffset={1} />}
      {tab === "emergency" && <EmergencyWizard stepOffset={1} />}
      {tab === "construction" && <ConstructionWizard stepOffset={1} />}
    </div>
  );
}
