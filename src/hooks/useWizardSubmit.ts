import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  createLead,
  type ContactTypeKind,
  type ServiceKind,
} from "../services/leadsService";

export type WizardSubmitInput = {
  service: ServiceKind;
  source: string;
  amount: number;
  contacts: {
    contactType: ContactTypeKind;
    name: string;
    phone: string;
    email: string;
  };
  extra?: Record<string, unknown>;
};

export type WizardFieldErrors = {
  name?: string;
  phone?: string;
  email?: string;
};

export type WizardSubmitState = {
  submit: () => Promise<void>;
  submitting: boolean;
  buttonDisabled: boolean;
  validationError: string | null;
  fieldErrors: WizardFieldErrors;
  attempted: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useWizardSubmit(
  input: WizardSubmitInput,
  externalDisabled = false,
): WizardSubmitState {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const phoneDigits = input.contacts.phone.replace(/\D/g, "");
  const emailTrim = input.contacts.email.trim();

  const nameValid = input.contacts.name.trim().length > 0;
  const phoneValid = phoneDigits.length === 11;
  const emailValid = emailTrim.length === 0 || EMAIL_RE.test(emailTrim);

  const contactsValid = nameValid && phoneValid && emailValid;
  const canSubmit = contactsValid && !externalDisabled;

  const fieldErrors: WizardFieldErrors = attempted
    ? {
        name: nameValid ? undefined : t("validation.required"),
        phone: phoneValid ? undefined : t("validation.phoneInvalid"),
        email: emailValid ? undefined : t("validation.emailInvalid"),
      }
    : {};

  const validationError =
    attempted && !contactsValid
      ? t("wizard.rental.step6Required", {
          defaultValue: "Заполните имя и телефон",
        })
      : null;

  const submit = useCallback(async () => {
    setAttempted(true);
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const normalized = phoneDigits.startsWith("8")
        ? "7" + phoneDigits.slice(1)
        : phoneDigits;
      const { redirectTo } = await createLead({
        name: input.contacts.name.trim(),
        phone: normalized,
        service: input.service,
        locale: i18n.language,
        source: input.source,
        email: emailTrim || undefined,
        contactType: input.contacts.contactType,
        amount: input.amount,
      });
      navigate(redirectTo);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }, [canSubmit, submitting, phoneDigits, emailTrim, input, i18n.language, navigate]);

  const buttonDisabled = submitting || externalDisabled;

  return {
    submit,
    submitting,
    buttonDisabled,
    validationError,
    fieldErrors,
    attempted,
  };
}
