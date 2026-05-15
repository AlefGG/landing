import { describe, it, expect } from "vitest";
import i18n from "../../../../i18n";
import { computeDisabledReason } from "../computeDisabledReason";
import type { ComputeDisabledReasonArgs } from "../computeDisabledReason";

const t = i18n.getFixedT("ru");

const BASE: ComputeDisabledReasonArgs = {
  cabinValidation: { ok: true },
  validatorReason: null,
  installConsent: true,
  firstLocation: { lat: 43.2, lng: 76.9 },
  contacts: { name: "Иван", phone: "+77001112233" },
  submitting: false,
  validationError: null,
  t,
};

describe("computeDisabledReason", () => {
  it("returns undefined when everything is valid", () => {
    expect(computeDisabledReason(BASE)).toBeUndefined();
  });

  it("priority 1: noCabinTypes", () => {
    const result = computeDisabledReason({
      ...BASE,
      cabinValidation: { ok: false, reason: "noCabinTypes" },
    });
    expect(result).toBe("Нет доступных типов кабин");
  });

  it("priority 2: noQuantitySelected", () => {
    const result = computeDisabledReason({
      ...BASE,
      cabinValidation: { ok: false, reason: "noQuantitySelected" },
    });
    expect(result).toBe("Выберите хотя бы одну кабину");
  });

  it("priority 3a: incomplete validatorReason falls through (not suppressed)", () => {
    const result = computeDisabledReason({
      ...BASE,
      validatorReason: "incomplete",
    });
    expect(result).toBe("Заполните даты и слоты установки и демонтажа");
  });

  it("priority 3b: installInPast validatorReason", () => {
    const result = computeDisabledReason({
      ...BASE,
      validatorReason: "installInPast",
    });
    expect(result).toBe("Дата установки не может быть в прошлом");
  });

  it("priority 4: installConsent missing", () => {
    const result = computeDisabledReason({
      ...BASE,
      installConsent: false,
    });
    expect(result).toBe("Подтвердите согласие с условиями установки");
  });

  it("priority 5: address missing", () => {
    const result = computeDisabledReason({
      ...BASE,
      firstLocation: null,
    });
    expect(result).toBe("Выберите адрес из подсказок или укажите точку на карте");
  });

  it("priority 6: name empty", () => {
    const result = computeDisabledReason({
      ...BASE,
      contacts: { name: "", phone: "+77001112233" },
    });
    expect(result).toBe("Заполните ФИО и телефон");
  });

  it("priority 6: phone empty", () => {
    const result = computeDisabledReason({
      ...BASE,
      contacts: { name: "Иван", phone: "" },
    });
    expect(result).toBe("Заполните ФИО и телефон");
  });

  it("priority 7: submitting", () => {
    const result = computeDisabledReason({
      ...BASE,
      submitting: true,
    });
    expect(result).toBe(t("payment.uploader.submitting"));
  });

  it("priority 8: validationError", () => {
    const result = computeDisabledReason({
      ...BASE,
      validationError: "Ошибка валидации",
    });
    expect(result).toBe("Ошибка валидации");
  });
});
