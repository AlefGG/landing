import { z } from "zod";
import { fetchValidated, ApiError } from "./apiClient";

export type SaleItemSpec = { label: string; value: string };

export type SaleItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
  specs: SaleItemSpec[];
};

const SaleItemSpecSchema = z.object({
  label: z.string(),
  value: z.string(),
});

// FE-TS-002 — pairs with backend/apps/catalog/serializers.py::EquipmentSerializer
const EquipmentDTOSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    price: z.string(),
    photo: z.string().nullable(),
    // F-007: structured spec rows from the admin panel. Backend versions
    // older than the F-007 deploy may omit the field; treat undefined as [].
    specs: z.array(SaleItemSpecSchema).nullable().optional(),
  })
  .describe("EquipmentDTOSchema");
type EquipmentDTO = z.infer<typeof EquipmentDTOSchema>;

const FALLBACK_IMAGE = "/assets/images/cabin-standard.png";

function mapEquipment(dto: EquipmentDTO): SaleItem {
  const rawSpecs = Array.isArray(dto.specs) ? dto.specs : [];
  // Defensive: drop malformed rows so a single bad admin entry doesn't
  // crash the SKU detail page.
  const specs = rawSpecs.filter(
    (s): s is SaleItemSpec =>
      !!s && typeof s.label === "string" && typeof s.value === "string",
  );
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? "",
    price: Number(dto.price),
    image: dto.photo && dto.photo.length > 0 ? dto.photo : FALLBACK_IMAGE,
    inStock: true,
    specs,
  };
}

const EquipmentListSchema = z
  .array(EquipmentDTOSchema)
  .describe("EquipmentListSchema");

export async function fetchCatalog(): Promise<SaleItem[]> {
  const data = await fetchValidated(
    "/catalog/sale/equipment/",
    EquipmentListSchema,
  );
  return data.map(mapEquipment);
}

export async function fetchCatalogItem(id: string): Promise<SaleItem | null> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0) return null;
  try {
    const dto = await fetchValidated(
      `/catalog/sale/equipment/${numericId}/`,
      EquipmentDTOSchema,
    );
    return mapEquipment(dto);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
