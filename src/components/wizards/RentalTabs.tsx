import { useState } from "react";
import { useTranslation } from "react-i18next";
import EventWizard from "./EventWizard";
import EmergencyWizard from "./EmergencyWizard";
import ConstructionWizard from "./ConstructionWizard";
import WizardHero from "./shared/WizardHero";

type TabKey = "event" | "emergency" | "construction";

export default function RentalTabs() {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;
  const [tab, setTab] = useState<TabKey>("event");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "event", label: t(`${k}.step1Event`) },
    { key: "emergency", label: t(`${k}.step1Emergency`) },
    { key: "construction", label: t(`${k}.step1Construction`) },
  ];

  return (
    <div className="bg-white overflow-x-clip">
      <WizardHero title={t(`${k}.title`)} />

      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
        <div
          role="tablist"
          aria-label={t(`${k}.step1Title`)}
          className="flex gap-2 lg:gap-4 overflow-x-auto scrollbar-none lg:px-[104px]"
        >
          {tabs.map(({ key, label }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(key)}
                className={`shrink-0 rounded-[40px] px-6 py-3 font-body text-base leading-6 transition-colors ${
                  active
                    ? "bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white"
                    : "bg-white text-neutral-600 border border-neutral-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {tab === "event" && <EventWizard />}
      {tab === "emergency" && <EmergencyWizard />}
      {tab === "construction" && <ConstructionWizard />}
    </div>
  );
}
