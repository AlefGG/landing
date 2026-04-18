import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { formatPhone } from "../components/wizards/shared/phoneFormat";

type SaveState = "idle" | "saving" | "saved" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [state, setState] = useState<SaveState>("idle");

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  if (!user) return null;

  const dirty = (user.name ?? "") !== name || (user.email ?? "") !== email;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);

    if (email && !EMAIL_RE.test(email)) {
      setEmailError(t("auth.profile.errors.email"));
      return;
    }

    setState("saving");
    try {
      await updateProfile({ name: name.trim(), email: email.trim() });
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-[12px] border border-neutral-200 bg-white p-6 max-w-xl flex flex-col gap-4"
      data-testid="profile-form"
    >
      <h2 className="font-display text-lg font-semibold text-neutral-900">
        {t("auth.profile.title")}
      </h2>

      <Field label={t("auth.profile.name")}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("auth.profile.namePlaceholder")}
          className="w-full rounded-[8px] border border-neutral-300 px-3 py-2 font-body text-sm"
          data-testid="profile-name"
        />
      </Field>

      <Field label={t("auth.profile.email")}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.profile.emailPlaceholder")}
          className="w-full rounded-[8px] border border-neutral-300 px-3 py-2 font-body text-sm"
          data-testid="profile-email"
        />
        {emailError && (
          <span className="font-body text-xs text-red-600 mt-1" data-testid="profile-email-error">
            {emailError}
          </span>
        )}
      </Field>

      <Field label={t("auth.profile.phone")}>
        <input
          type="text"
          value={formatPhone(user.phone)}
          disabled
          className="w-full rounded-[8px] border border-neutral-200 bg-neutral-100 px-3 py-2 font-body text-sm text-neutral-500"
          data-testid="profile-phone"
        />
        <span className="font-body text-xs text-neutral-500 mt-1">
          {t("auth.profile.phoneHint")}
        </span>
      </Field>

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          variant="cta"
          size="md"
          disabled={!dirty || state === "saving"}
          data-testid="profile-submit"
        >
          {state === "saving"
            ? t("auth.profile.saving")
            : t("auth.profile.submit")}
        </Button>
        {state === "saved" && (
          <span className="font-body text-sm text-green-700" data-testid="profile-saved">
            {t("auth.profile.saved")}
          </span>
        )}
        {state === "error" && (
          <span className="font-body text-sm text-red-600" data-testid="profile-save-error">
            {t("auth.profile.errors.saveFailed")}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-xs font-semibold text-neutral-700">
        {label}
      </span>
      {children}
    </label>
  );
}
