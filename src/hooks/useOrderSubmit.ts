import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
  onPendingAuthChange?: (pending: boolean) => void;
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
  pendingAuth: boolean;
  cancelPendingAuth: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useOrderSubmit({
  contacts,
  buildOrder,
  canProceed = true,
  mapServerField,
  afterCreate,
  onPendingAuthChange,
}: UseOrderSubmitOptions): UseOrderSubmitResult {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status: authStatus } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<NormalizedError | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [unknownFieldErrors, setUnknownFieldErrors] = useState<Record<string, string>>({});
  const [pendingAuth, setPendingAuthState] = useState(false);

  const phoneDigits = contacts.phone.replace(/\D/g, "");
  const emailTrim = contacts.email.trim();

  const nameValid = contacts.name.trim().length > 0;
  const phoneValid = phoneDigits.length === 11;
  const emailValid = emailTrim.length === 0 || EMAIL_RE.test(emailTrim);

  const contactsValid = nameValid && phoneValid && emailValid;
  const canSubmit = contactsValid && canProceed;

  // FE-DT-007: cancellation epoch — incremented by cancelPendingAuth and
  // checked after every await inside runBuildOrder. If the user dismisses
  // the OTP gate while runBuildOrder is mid-flight, the resolved order is
  // ignored (no navigate, no state writes after the boundary).
  const submitEpochRef = useRef(0);

  const setPendingAuth = useCallback(
    (next: boolean) => {
      setPendingAuthState(next);
      onPendingAuthChange?.(next);
    },
    [onPendingAuthChange],
  );

  const cancelPendingAuth = useCallback(() => {
    submitEpochRef.current += 1;
    setPendingAuth(false);
  }, [setPendingAuth]);

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
      ? t("wizard.rental.step6Required")
      : null;

  const runBuildOrder = useCallback(async () => {
    if (submitting) return;
    const epoch = submitEpochRef.current;
    setSubmitting(true);
    try {
      const order = await buildOrder();
      // FE-DT-007: bail if cancelPendingAuth bumped the epoch mid-await.
      // Order may have been created on the backend, but the user has
      // dismissed the OTP gate — don't navigate or write success state.
      if (submitEpochRef.current !== epoch) return;
      if (afterCreate) {
        await afterCreate(order);
        if (submitEpochRef.current !== epoch) return;
      }
      navigate(`/orders/${order.order_number}/pay`);
    } catch (err) {
      if (submitEpochRef.current !== epoch) return;
      const normalized = normalizeError(err);
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
      setPendingAuth(false);
    } finally {
      if (submitEpochRef.current === epoch) {
        setSubmitting(false);
      }
    }
  }, [submitting, buildOrder, afterCreate, navigate, mapServerField, setPendingAuth]);

  // Auto-trigger buildOrder when user authenticates while pendingAuth is true.
  // Use a ref to avoid double-fire if effect re-runs while the async call is in flight.
  const triggerRef = useRef(false);
  useEffect(() => {
    if (pendingAuth && authStatus === "authenticated" && !triggerRef.current) {
      triggerRef.current = true;
      void (async () => {
        try {
          await runBuildOrder();
        } finally {
          setPendingAuth(false);
          triggerRef.current = false;
        }
      })();
    }
  }, [pendingAuth, authStatus, runBuildOrder, setPendingAuth]);

  const submit = useCallback(async () => {
    setAttempted(true);
    setSubmitError(null);
    setServerFieldErrors({});
    setUnknownFieldErrors({});
    if (!canSubmit || submitting) return;

    if (authStatus !== "authenticated") {
      setPendingAuth(true);
      return;
    }

    await runBuildOrder();
  }, [canSubmit, submitting, authStatus, runBuildOrder, setPendingAuth]);

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
    pendingAuth,
    cancelPendingAuth,
  };
}
