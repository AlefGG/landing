import { useEffect, useRef, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { BasicInput } from "../../ui";
import { useAuth } from "../../../contexts/AuthContext";
import { formatPhone } from "./phoneFormat";
import Toggle from "./Toggle";

export type ContactType = "individual" | "legal";

export type ContactsValue = {
  contactType: ContactType;
  name: string;
  phone: string;
  email: string;
  useProfile?: boolean;
};

export default function ContactsSection({
  value,
  onChange,
}: {
  value: ContactsValue;
  onChange: (v: ContactsValue) => void;
}) {
  const { t } = useTranslation();
  const { user, status } = useAuth();
  const k = "wizard.rental" as const;
  const isAuthed = status === "authenticated" && !!user;
  const useProfile = value.useProfile === true;
  const prevUseProfileRef = useRef(useProfile);

  useEffect(() => {
    if (!isAuthed) {
      if (value.useProfile) {
        onChange({ ...value, useProfile: false });
      }
      prevUseProfileRef.current = false;
      return;
    }
    if (!useProfile) {
      prevUseProfileRef.current = false;
      return;
    }
    const profileName = user?.name ?? "";
    const profilePhone = user?.phone ? formatPhone(user.phone) : "";
    const profileEmail = user?.email ?? "";
    const justTurnedOn = !prevUseProfileRef.current;
    const needsSync =
      justTurnedOn ||
      value.name !== profileName ||
      value.phone !== profilePhone ||
      value.email !== profileEmail;
    if (needsSync) {
      onChange({
        ...value,
        name: profileName,
        phone: profilePhone,
        email: profileEmail,
      });
    }
    prevUseProfileRef.current = true;
  }, [isAuthed, user, useProfile, value, onChange]);

  const set = <K extends keyof ContactsValue>(key: K, v: ContactsValue[K]) =>
    onChange({ ...value, [key]: v });

  const setField = <K extends "name" | "phone" | "email">(
    key: K,
    v: string,
  ) => {
    if (useProfile) {
      onChange({ ...value, [key]: v, useProfile: false });
    } else {
      set(key, v);
    }
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setField("phone", formatPhone(e.target.value));
  };

  return (
    <div className="mt-8 lg:mt-4 lg:py-6 flex flex-col gap-8">
      <div className="flex flex-row gap-2 lg:gap-[72px]">
        {(["individual", "legal"] as ContactType[]).map((typ) => (
          <button
            key={typ}
            type="button"
            onClick={() => set("contactType", typ)}
            className="flex flex-1 lg:flex-initial items-center gap-2"
          >
            <span
              className={`size-5 shrink-0 rounded-full overflow-hidden ${
                value.contactType === typ
                  ? "bg-cta-main flex items-center justify-center"
                  : "border border-neutral-500"
              }`}
            >
              {value.contactType === typ && <span className="size-[6px] rounded-full bg-white" />}
            </span>
            <span
              className={`font-body text-xl leading-6 ${
                value.contactType === typ ? "text-neutral-900" : "text-neutral-600"
              }`}
            >
              {t(`${k}.${typ === "individual" ? "step6Individual" : "step6Legal"}`)}
            </span>
          </button>
        ))}
      </div>

      {isAuthed && (
        <Toggle
          checked={useProfile}
          onChange={(v) => set("useProfile", v)}
          label={t("wizard.contacts.useProfile")}
        />
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        <div className="flex flex-col gap-2 w-full lg:w-[280px]">
          <label className="font-body text-xl leading-6 text-neutral-600">
            {t(`${k}.step6Name`)}
          </label>
          <BasicInput
            value={value.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder={t(`${k}.step6Placeholder`)}
            className="!h-10"
          />
        </div>
        <div className="flex flex-col gap-2 w-full lg:w-[280px]">
          <label className="font-body text-xl leading-6 text-neutral-600">
            {t(`${k}.step6Phone`)}
          </label>
          <BasicInput
            type="tel"
            value={value.phone}
            onChange={handlePhoneChange}
            placeholder="+7 XXX XXX-XX-XX"
            className="!h-10"
          />
        </div>
        <div className="flex flex-col gap-2 w-full lg:w-[280px]">
          <label className="font-body text-xl leading-6 text-neutral-600">
            {t(`${k}.step6Email`)}
          </label>
          <BasicInput
            value={value.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder={t(`${k}.step6Placeholder`)}
            className="!h-10"
          />
        </div>
      </div>
    </div>
  );
}
