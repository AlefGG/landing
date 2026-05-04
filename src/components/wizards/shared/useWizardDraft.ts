import { useEffect, useState, useCallback } from "react";
import {
  loadDraft,
  saveDraft,
  clearDraft as clearStoredDraft,
  type WizardSlug,
} from "../../../services/wizardDraft";

const DEFAULT_DEBOUNCE_MS = 300;

export type WizardDraftHandle<T> = {
  draft: T;
  setDraft: React.Dispatch<React.SetStateAction<T>>;
  clearDraft: () => void;
};

export type UseWizardDraftOptions = {
  debounceMs?: number;
};

export function useWizardDraft<T>(
  slug: WizardSlug,
  initialDefaults: T,
  options?: UseWizardDraftOptions,
): WizardDraftHandle<T> {
  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  const [draft, setDraft] = useState<T>(
    () => loadDraft<T>(slug) ?? initialDefaults,
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      saveDraft<T>(slug, draft);
    }, debounceMs);
    return () => window.clearTimeout(handle);
  }, [slug, draft, debounceMs]);

  const clearDraft = useCallback(() => {
    clearStoredDraft(slug);
  }, [slug]);

  return { draft, setDraft, clearDraft };
}
