import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  OrderValidationError,
  type OrderResponse,
} from "../services/orderService";
import type { ContactsValue } from "../components/wizards/shared/ContactsSection";

export type WizardFieldErrors = {
  name?: string;
  phone?: string;
  email?: string;
};

export type UseOrderSubmitOptions = {
  contacts: ContactsValue;
  buildOrder: () => Promise<OrderResponse>;
  canProceed?: boolean;
};

export type UseOrderSubmitResult = {
  submit: () => Promise<void>;
  submitting: boolean;
  buttonDisabled: boolean;
  validationError: string | null;
  fieldErrors: WizardFieldErrors;
  attempted: boolean;
  submitError: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useOrderSubmit({
  contacts,
  buildOrder,
  canProceed = true,
}: UseOrderSubmitOptions): UseOrderSubmitResult {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { status: authStatus } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    setSubmitError(null);
    if (!canSubmit || submitting) return;

    if (authStatus !== "authenticated") {
      const redirect = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${redirect}`);
      return;
    }

    setSubmitting(true);
    try {
      const order = await buildOrder();
      navigate(`/orders/${order.order_number}/pay`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      if (err instanceof OrderValidationError) {
        setSubmitError(err.message);
      } else {
        setSubmitError(
          t("wizard.rental.submitError", {
            defaultValue: "Не удалось создать заказ, попробуйте ещё раз",
          }),
        );
      }
    }
  }, [
    canSubmit,
    submitting,
    authStatus,
    buildOrder,
    navigate,
    location.pathname,
    location.search,
    t,
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
  };
}
