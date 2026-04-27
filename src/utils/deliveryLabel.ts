import type { DeliveryPreview } from "../services/deliveryService";

type Translator = (
  key: string,
  params?: Record<string, unknown>,
) => string;

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
