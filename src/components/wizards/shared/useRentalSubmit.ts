import { useCallback } from "react";
import {
  useOrderSubmit,
  type UseOrderSubmitResult,
} from "../../../hooks/useOrderSubmit";
import {
  useOrderPreview,
  type PreviewResult,
} from "../../../hooks/useOrderPreview";
import {
  saveDraft,
  clearDraft as clearStoredDraft,
  type WizardSlug,
} from "../../../services/wizardDraft";
import type { OrderResponse } from "../../../services/orderService";
import type { ContactsValue } from "./ContactsSection";

export type UseRentalSubmitConfig<TPayload, TPreview> = {
  draftSlug: WizardSlug;
  contacts: ContactsValue;
  canProceed: boolean;
  previewPayload: TPayload | null;
  previewer: (payload: TPayload) => Promise<TPreview>;
  createOrder: () => Promise<OrderResponse>;
  mapServerField?: (field: string) => string | null;
  /**
   * Snapshot of the current draft to persist when pendingAuth flips true.
   * Hook reads it lazily inside the onPendingAuthChange callback so the
   * latest render's draft is captured.
   */
  draftSnapshot: () => unknown;
};

export type UseRentalSubmitResult<TPreview> = {
  preview: PreviewResult<TPreview>;
  submitState: UseOrderSubmitResult;
};

export function useRentalSubmit<TPayload, TPreview>({
  draftSlug,
  contacts,
  canProceed,
  previewPayload,
  previewer,
  createOrder,
  mapServerField,
  draftSnapshot,
}: UseRentalSubmitConfig<TPayload, TPreview>): UseRentalSubmitResult<TPreview> {
  const preview = useOrderPreview<TPayload, TPreview>(previewPayload, previewer);

  const afterCreate = useCallback(async () => {
    clearStoredDraft(draftSlug);
  }, [draftSlug]);

  const onPendingAuthChange = useCallback(
    (pending: boolean) => {
      if (pending) {
        saveDraft(draftSlug, draftSnapshot());
      }
    },
    [draftSlug, draftSnapshot],
  );

  const submitState = useOrderSubmit({
    contacts,
    canProceed,
    mapServerField,
    buildOrder: createOrder,
    afterCreate,
    onPendingAuthChange,
  });

  return { preview, submitState };
}
