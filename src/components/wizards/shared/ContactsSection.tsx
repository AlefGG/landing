import { type ChangeEvent } from "react";
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
  // BE-6: optional on-site contact person (may differ from the orderer) +
  // free-text install-address / landmark note, on top of the map pin.
  siteContactName?: string;
  siteContactPhone?: string;
  installNote?: string;
};

export type ContactsFieldErrors = {
  name?: string;
  phone?: string;
  email?: string;
};

export default function ContactsSection({
  value,
  onChange,
  errors,
}: {
  value: ContactsValue;
  onChange: (v: ContactsValue) => void;
  errors?: ContactsFieldErrors;
}) {
  const { t } = useTranslation();
  const { user, status } = useAuth();
  const k = "wizard.rental" as const;
  const isAuthed = status === "authenticated" && !!user;
  const useProfile = value.useProfile === true;
  // Defensive: if user de-auths while wizard form has useProfile=true, the
  // toggle vanishes but the value persists. Treat as false at render so the
  // de-auth case doesn't keep `setField` stuck on the wrong branch either.
  const effectiveUseProfile = isAuthed && useProfile;

  const set = <K extends keyof ContactsValue>(key: K, v: ContactsValue[K]) =>
    onChange({ ...value, [key]: v });

  const setField = <K extends "name" | "phone" | "email">(
    key: K,
    v: string,
  ) => {
    if (effectiveUseProfile) {
      onChange({ ...value, [key]: v, useProfile: false });
    } else {
      set(key, v);
    }
  };

  const handleToggleUseProfile = (next: boolean) => {
    if (next && isAuthed && user) {
      onChange({
        ...value,
        useProfile: true,
        name: user.first_name ?? "",
        phone: user.phone ? formatPhone(user.phone) : "",
        email: user.email ?? "",
      });
    } else {
      onChange({ ...value, useProfile: next });
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
          checked={effectiveUseProfile}
          onChange={handleToggleUseProfile}
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
            placeholder={t(`${k}.step6NamePlaceholder`)}
            aria-invalid={errors?.name ? true : undefined}
            className={`!h-10 ${errors?.name ? "!border-red-500" : ""}`}
          />
          {errors?.name && (
            <p role="alert" className="font-body text-sm leading-4 text-red-600">
              {errors.name}
            </p>
          )}
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
            aria-invalid={errors?.phone ? true : undefined}
            className={`!h-10 ${errors?.phone ? "!border-red-500" : ""}`}
          />
          {errors?.phone && (
            <p role="alert" className="font-body text-sm leading-4 text-red-600">
              {errors.phone}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full lg:w-[280px]">
          <label className="font-body text-xl leading-6 text-neutral-600">
            {t(`${k}.step6Email`)}
          </label>
          <BasicInput
            value={value.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder={t(`${k}.step6EmailPlaceholder`)}
            aria-invalid={errors?.email ? true : undefined}
            className={`!h-10 ${errors?.email ? "!border-red-500" : ""}`}
          />
          {errors?.email && (
            <p role="alert" className="font-body text-sm leading-4 text-red-600">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      {/* BE-6: optional on-site contact person + install-address note. */}
      <div className="flex flex-col gap-4 border-t border-neutral-200 pt-6">
        <div className="flex flex-col gap-1">
          <h3 className="font-body text-xl leading-6 text-neutral-900">
            {t(`${k}.step6SiteContactTitle`)}
          </h3>
          <p className="font-body text-sm leading-5 text-neutral-500">
            {t(`${k}.step6SiteContactHint`)}
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          <div className="flex flex-col gap-2 w-full lg:w-[280px]">
            <label className="font-body text-xl leading-6 text-neutral-600">
              {t(`${k}.step6SiteContactName`)}
            </label>
            <BasicInput
              value={value.siteContactName ?? ""}
              onChange={(e) => set("siteContactName", e.target.value)}
              placeholder={t(`${k}.step6SiteContactNamePlaceholder`)}
              className="!h-10"
            />
          </div>
          <div className="flex flex-col gap-2 w-full lg:w-[280px]">
            <label className="font-body text-xl leading-6 text-neutral-600">
              {t(`${k}.step6SiteContactPhone`)}
            </label>
            <BasicInput
              type="tel"
              value={value.siteContactPhone ?? ""}
              onChange={(e) => set("siteContactPhone", formatPhone(e.target.value))}
              placeholder="+7 XXX XXX-XX-XX"
              className="!h-10"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className="font-body text-xl leading-6 text-neutral-600">
            {t(`${k}.step6InstallNoteLabel`)}
          </label>
          <textarea
            value={value.installNote ?? ""}
            onChange={(e) => set("installNote", e.target.value)}
            placeholder={t(`${k}.step6InstallNotePlaceholder`)}
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-neutral-300 px-4 py-2 font-body text-lg leading-6 text-neutral-900 placeholder:text-neutral-400 focus:border-cta-main focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
}
