import type { DeliveryPreview } from "../services/deliveryService";

// Loose translator type — accepts the i18next TFunction as well as the
// fake (key, params) => string helper used in unit tests. We only need the
// (key, params) overload here, so widen to `any` argument shape to keep
// callers (vitest fakes, react-i18next TFunction) interchangeable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Translator = (key: any, params?: any) => string;

export function deliveryLabel(
  preview: DeliveryPreview | null,
  t: Translator,
): string {
  if (!preview) return "";
  if (preview.deliverySource === "zone" && preview.deliveryZone) {
    return t("delivery.zone", { name: preview.deliveryZone.name });
  }
  return t("delivery.routing", { km: preview.distanceKm.toFixed(1) });
}
