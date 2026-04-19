import { fetchJson, ApiError } from "./apiClient";

export type SaleItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
};

type EquipmentDTO = {
  id: number;
  name: string;
  description: string;
  price: string;
  photo: string | null;
};

const FALLBACK_IMAGE = "/assets/images/cabin-standard.png";

function mapEquipment(dto: EquipmentDTO): SaleItem {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? "",
    price: Number(dto.price),
    image: dto.photo && dto.photo.length > 0 ? dto.photo : FALLBACK_IMAGE,
    inStock: true,
  };
}

export async function fetchCatalog(): Promise<SaleItem[]> {
  const data = await fetchJson<EquipmentDTO[]>("/catalog/sale/equipment/");
  return data.map(mapEquipment);
}

export async function fetchCatalogItem(id: string): Promise<SaleItem | null> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0) return null;
  try {
    const dto = await fetchJson<EquipmentDTO>(
      `/catalog/sale/equipment/${numericId}/`,
    );
    return mapEquipment(dto);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
