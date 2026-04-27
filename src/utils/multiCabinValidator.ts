import type { CabinTypeDTO } from "../hooks/useCabinTypes";
import type { OrderItemInput } from "../services/orderService";

export type CabinQuantityMap = Map<number, number>;

export type MultiCabinValidationReason =
  | "noCabinTypes"
  | "noQuantitySelected";

export type MultiCabinValidationResult =
  | { ok: true; payload: OrderItemInput[]; total: number }
  | { ok: false; reason: MultiCabinValidationReason };

export function validateMultiCabin(
  quantities: CabinQuantityMap,
  types: CabinTypeDTO[] | null,
): MultiCabinValidationResult {
  if (!types || types.length === 0) return { ok: false, reason: "noCabinTypes" };
  const sorted = [...types].sort((a, b) => a.id - b.id);
  const payload: OrderItemInput[] = [];
  let total = 0;
  for (const t of sorted) {
    const q = quantities.get(t.id) ?? 0;
    if (q <= 0) continue;
    payload.push({ cabin_type: t.id, quantity: q });
    total += q;
  }
  if (total <= 0) return { ok: false, reason: "noQuantitySelected" };
  return { ok: true, payload, total };
}
