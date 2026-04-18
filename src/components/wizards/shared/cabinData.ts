export type CabinType = "standard" | "lux" | "vip";
export type ConstructionCabinType = "construction-standard";

export const rentalCabins: { type: CabinType; image: string }[] = [
  { type: "standard", image: "/assets/images/cabin-standard.png" },
  { type: "lux", image: "/assets/images/cabin-lux.png" },
  { type: "vip", image: "/assets/images/cabin-vip.png" },
];

export const constructionCabins: { type: ConstructionCabinType; image: string }[] = [
  { type: "construction-standard", image: "/assets/images/cabin-standard.png" },
];
