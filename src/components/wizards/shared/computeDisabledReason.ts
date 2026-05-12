import type { TFunction } from "i18next";
import type { ContactsValue } from "./ContactsSection";

export type CabinValidationResult =
  | { ok: true }
  | { ok: false; reason: "noCabinTypes" | "noQuantitySelected" };

export type InstallValidatorReason =
  | "incomplete"
  | "installInPast"
  | "dismantleBeforeInstall"
  | "windowExceeds90"
  | "sameDaySlotOverlap";

export interface ComputeDisabledReasonArgs {
  cabinValidation: CabinValidationResult;
  /** Full validator reason (inclusive of "incomplete") — null if ok */
  validatorReason: InstallValidatorReason | null;
  installConsent: boolean;
  firstLocation: { lat: number; lng: number } | null;
  contacts: Pick<ContactsValue, "name" | "phone">;
  submitting: boolean;
  validationError: string | null;
  t: TFunction;
}

const k = "wizard.rental" as const;

/**
 * Computes the user-facing reason why "Отправить заявку" is disabled.
 * Priority order mirrors the cascade documented in B-1.
 * Returns undefined when the button should be enabled.
 */
export function computeDisabledReason({
  cabinValidation,
  validatorReason,
  installConsent,
  firstLocation,
  contacts,
  submitting,
  validationError,
  t,
}: ComputeDisabledReasonArgs): string | undefined {
  if (!cabinValidation.ok && cabinValidation.reason === "noCabinTypes") {
    return t(`${k}.cabinSelector.noCabinTypes`);
  }
  if (!cabinValidation.ok && cabinValidation.reason === "noQuantitySelected") {
    return t(`${k}.cabinSelector.noQuantitySelected`);
  }
  if (validatorReason) {
    return t(`${k}.installValidator.${validatorReason}`);
  }
  if (!installConsent) {
    return t(`${k}.installConsentRequired`);
  }
  if (!firstLocation) {
    return t(`${k}.addressRequired`);
  }
  if (!contacts.name.trim() || !contacts.phone.trim()) {
    return t(`${k}.contactsRequired`);
  }
  if (submitting) {
    return t("payment.uploader.submitting");
  }
  return validationError ?? undefined;
}
