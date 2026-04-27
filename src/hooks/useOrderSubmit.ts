import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { type OrderResponse } from "../services/orderService";
import { normalizeError, type NormalizedError } from "../services/errors";
import type { ContactsValue } from "../components/wizards/shared/ContactsSection";

export type WizardFieldErrors = Partial<Record<string, string>>;

export type UseOrderSubmitOptions = {
  contacts: ContactsValue;
  buildOrder: () => Promise<OrderResponse>;
  canProceed?: boolean;
  mapServerField?: (field: string) => string | null;
  afterCreate?: (order: OrderResponse) => Promise<void>;
};

export type UseOrderSubmitResult = {
  submit: () => Promise<void>;
  submitting: boolean;
  buttonDisabled: boolean;
  validationError: string | null;
  fieldErrors: WizardFieldErrors;
  attempted: boolean;
  submitError: NormalizedError | null;
  unknownFieldErrors: Record<string, string>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useOrderSubmit({
  contacts,
  buildOrder,
  canProceed = true,
  mapServerField,
  afterCreate,
}: UseOrderSubmitOptions): UseOrderSubmitResult {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { status: authStatus } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<NormalizedError | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [unknownFieldErrors, setUnknownFieldErrors] = useState<Record<string, string>>({});

  const phoneDigits = contacts.phone.replace(/\D/g, "");
  const emailTrim = contacts.email.trim();

  const nameValid = contacts.name.trim().length > 0;
  const phoneValid = phoneDigits.length === 11;
  const emailValid = emailTrim.length === 0 || EMAIL_RE.test(emailTrim);

  const contactsValid = nameValid && phoneValid && emailValid;
  const canSubmit = contactsValid && canProceed;

  const fieldErrors: WizardFieldErrors = attempted
    ? {
        name: nameValid ? undefined : t("validation.required"),
        phone: phoneValid ? undefined : t("validation.phoneInvalid"),
        email: emailValid ? undefined : t("validation.emailInvalid"),
        ...serverFieldErrors,
      }
    : { ...serverFieldErrors };

  const validationError =
    attempted && !contactsValid
      ? t("wizard.rental.step6Required", {
          defaultValue: "Заполните имя и телефон",
        })
      : null;

  const submit = useCallback(async () => {
    setAttempted(true);
    setSubmitError(null);
    setServerFieldErrors({});
    setUnknownFieldErrors({});
    if (!canSubmit || submitting) return;

    if (authStatus !== "authenticated") {
      const redirect = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${redirect}`);
      return;
    }

    setSubmitting(true);
    try {
      const order = await buildOrder();
      if (afterCreate) {
        await afterCreate(order);
      }
      navigate(`/orders/${order.order_number}/pay`);
    } catch (err) {
      const normalized = normalizeError(err);
      if (normalized.kind === "auth") {
        const redirect = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?redirect=${redirect}`);
        return;
      }
      if (normalized.fieldErrors) {
        const known: Record<string, string> = {};
        const unknown: Record<string, string> = {};
        for (const [serverField, message] of Object.entries(normalized.fieldErrors)) {
          const uiField = mapServerField?.(serverField) ?? null;
          if (uiField) {
            known[uiField] = message;
          } else {
            unknown[serverField] = message;
          }
        }
        setServerFieldErrors(known);
        setUnknownFieldErrors(unknown);
      }
      setSubmitError(normalized);
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmit,
    submitting,
    authStatus,
    buildOrder,
    afterCreate,
    navigate,
    location.pathname,
    location.search,
    mapServerField,
  ]);

  const buttonDisabled = submitting || !canProceed;

  return {
    submit,
    submitting,
    buttonDisabled,
    validationError,
    fieldErrors,
    attempted,
    submitError,
    unknownFieldErrors,
  };
}
