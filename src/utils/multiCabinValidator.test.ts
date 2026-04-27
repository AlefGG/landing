import { describe, expect, it } from "vitest";
import { validateMultiCabin } from "./multiCabinValidator";
import type { CabinTypeDTO } from "../hooks/useCabinTypes";

const t1: CabinTypeDTO = {
  id: 1,
  name: "Standard",
  slug: "standard",
  description: "",
  photo: null,
  block_periods: [],
};
const t2: CabinTypeDTO = {
  id: 2,
  name: "Lux",
  slug: "luxury",
  description: "",
  photo: null,
  block_periods: [],
};

describe("validateMultiCabin", () => {
  it("returns noCabinTypes when types is null", () => {
    const r = validateMultiCabin(new Map(), null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("noCabinTypes");
  });

  it("returns noCabinTypes when types is empty", () => {
    const r = validateMultiCabin(new Map(), []);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("noCabinTypes");
  });

  it("returns noQuantitySelected when map is empty", () => {
    const r = validateMultiCabin(new Map(), [t1, t2]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("noQuantitySelected");
  });

  it("returns noQuantitySelected when all quantities are zero", () => {
    const m = new Map<number, number>([
      [t1.id, 0],
      [t2.id, 0],
    ]);
    const r = validateMultiCabin(m, [t1, t2]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("noQuantitySelected");
  });

  it("returns ok with single non-zero entry", () => {
    const m = new Map<number, number>([[t1.id, 3]]);
    const r = validateMultiCabin(m, [t1, t2]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload).toEqual([{ cabin_type: 1, quantity: 3 }]);
      expect(r.total).toBe(3);
    }
  });

  it("returns ok with two non-zero entries sorted by id asc", () => {
    const m = new Map<number, number>([
      [t2.id, 1],
      [t1.id, 2],
    ]);
    const r = validateMultiCabin(m, [t2, t1]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload).toEqual([
        { cabin_type: 1, quantity: 2 },
        { cabin_type: 2, quantity: 1 },
      ]);
      expect(r.total).toBe(3);
    }
  });

  it("ignores ghost ids not in types", () => {
    const m = new Map<number, number>([
      [9999, 5],
      [t1.id, 2],
    ]);
    const r = validateMultiCabin(m, [t1]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload).toEqual([{ cabin_type: 1, quantity: 2 }]);
      expect(r.total).toBe(2);
    }
  });

  it("filters out zero quantities from payload", () => {
    const m = new Map<number, number>([
      [t1.id, 2],
      [t2.id, 0],
    ]);
    const r = validateMultiCabin(m, [t1, t2]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload).toEqual([{ cabin_type: 1, quantity: 2 }]);
      expect(r.total).toBe(2);
    }
  });
});
