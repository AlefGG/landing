import { render, screen, cleanup } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, it } from "vitest";
import MultiCabinSelector, {
  type CabinQuantityMap,
} from "../MultiCabinSelector";
import type { CabinTypeDTO } from "../../../../hooks/useCabinTypes";
import i18n from "../../../../i18n";

const dto = (
  id: number,
  slug: string,
  name: string,
  description = "Описание",
): CabinTypeDTO => ({
  id,
  slug,
  name,
  description,
  photo: null,
  block_periods: [],
});

afterEach(cleanup);

describe("MultiCabinSelector — C-1 slug dedup", () => {
  it("renders one row per unique slug regardless of duplicate DTOs", () => {
    const types: CabinTypeDTO[] = [
      dto(1, "standard", "Стандарт"),
      dto(5, "standard", "Стандарт (другая компания)"),
      dto(2, "luxury", "Люкс"),
    ];
    render(
      <I18nextProvider i18n={i18n}>
        <MultiCabinSelector
          types={types}
          loading={false}
          quantities={new Map() as CabinQuantityMap}
          onChange={() => {}}
        />
      </I18nextProvider>,
    );
    // first-occurrence wins; both standard rows collapse to id=1
    expect(screen.getAllByText("Стандарт")).toHaveLength(1);
    expect(screen.queryByText("Стандарт (другая компания)")).toBeNull();
    expect(screen.getAllByText("Люкс")).toHaveLength(1);
  });

  it("drops rows with empty slug", () => {
    const types: CabinTypeDTO[] = [
      dto(1, "", "Без слага"),
      dto(2, "standard", "Стандарт"),
    ];
    render(
      <I18nextProvider i18n={i18n}>
        <MultiCabinSelector
          types={types}
          loading={false}
          quantities={new Map() as CabinQuantityMap}
          onChange={() => {}}
        />
      </I18nextProvider>,
    );
    expect(screen.queryByText("Без слага")).toBeNull();
    expect(screen.getAllByText("Стандарт")).toHaveLength(1);
  });

  it("preserves all unique slugs", () => {
    const types: CabinTypeDTO[] = [
      dto(1, "standard", "Стандарт"),
      dto(2, "luxury", "Люкс"),
      dto(3, "vip", "VIP"),
      dto(4, "construction", "Стандарт-Строительный"),
    ];
    render(
      <I18nextProvider i18n={i18n}>
        <MultiCabinSelector
          types={types}
          loading={false}
          quantities={new Map() as CabinQuantityMap}
          onChange={() => {}}
        />
      </I18nextProvider>,
    );
    expect(screen.getAllByText("Стандарт")).toHaveLength(1);
    expect(screen.getAllByText("Люкс")).toHaveLength(1);
    expect(screen.getAllByText("VIP")).toHaveLength(1);
    expect(screen.getAllByText("Стандарт-Строительный")).toHaveLength(1);
  });
});
