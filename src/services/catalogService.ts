export type SaleItem = {
  id: "standard" | "lux" | "vip";
  nameKey: string;
  featuresKey: string;
  descriptionKey: string;
  price: number;
  image: string;
  inStock: boolean;
};

// TODO(backend): replace mock with GET /api/catalog/equipment/
const MOCK_ITEMS: SaleItem[] = [
  {
    id: "standard",
    nameKey: "wizard.cabins.standard",
    featuresKey: "cabins.standard.features",
    descriptionKey: "catalog.sale.items.standard.description",
    price: 350000,
    image: "/assets/images/cabin-standard.png",
    inStock: true,
  },
  {
    id: "lux",
    nameKey: "wizard.cabins.lux",
    featuresKey: "cabins.lux.features",
    descriptionKey: "catalog.sale.items.lux.description",
    price: 550000,
    image: "/assets/images/cabin-lux.png",
    inStock: true,
  },
  {
    id: "vip",
    nameKey: "wizard.cabins.vip",
    featuresKey: "cabins.vip.features",
    descriptionKey: "catalog.sale.items.vip.description",
    price: 850000,
    image: "/assets/images/cabin-vip.png",
    inStock: true,
  },
];

export async function fetchCatalog(): Promise<SaleItem[]> {
  return Promise.resolve(MOCK_ITEMS);
}

export async function fetchCatalogItem(id: string): Promise<SaleItem | null> {
  const item = MOCK_ITEMS.find((i) => i.id === id);
  return Promise.resolve(item ?? null);
}
