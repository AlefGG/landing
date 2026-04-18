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

export type WizardSubmitState = {
  submit: () => Promise<void>;
  submitting: boolean;
  buttonDisabled: boolean;
  validationError: string | null;
};

export function useWizardSubmit(
  input: WizardSubmitInput,
  externalDisabled = false,
): WizardSubmitState {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const phoneDigits = input.contacts.phone.replace(/\D/g, "");
  const contactsValid =
    input.contacts.name.trim().length > 0 && phoneDigits.length === 11;

  const canSubmit = contactsValid && !externalDisabled;

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
        email: input.contacts.email.trim() || undefined,
        contactType: input.contacts.contactType,
        amount: input.amount,
      });
      navigate(redirectTo);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }, [canSubmit, submitting, phoneDigits, input, i18n.language, navigate]);

  const buttonDisabled = submitting || externalDisabled;

  return { submit, submitting, buttonDisabled, validationError };
}
