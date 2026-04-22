import { describe, it, expect } from "vitest";
import { normalizeError } from "./errors";
import { ApiError, AuthExpiredError } from "./apiClient";
import { OrderValidationError } from "./orderService";

describe("normalizeError", () => {
  it("AuthExpiredError → auth/401", () => {
    expect(normalizeError(new AuthExpiredError())).toEqual({ kind: "auth", status: 401 });
  });

  it("ApiError(401) → auth", () => {
    expect(normalizeError(new ApiError(401, "x"))).toMatchObject({ kind: "auth", status: 401 });
  });

  it("ApiError(403) with detail → forbidden", () => {
    expect(normalizeError(new ApiError(403, "x", { detail: "nope" })))
      .toMatchObject({ kind: "forbidden", status: 403, detail: "nope" });
  });

  it("ApiError(404) → notFound", () => {
    expect(normalizeError(new ApiError(404, "x"))).toMatchObject({ kind: "notFound" });
  });

  it("ApiError(409) with detail → conflict", () => {
    expect(normalizeError(new ApiError(409, "x", { detail: "locked" })))
      .toMatchObject({ kind: "conflict", detail: "locked" });
  });

  it("ApiError(429) → rateLimit", () => {
    expect(normalizeError(new ApiError(429, "x"))).toMatchObject({ kind: "rateLimit" });
  });

  it("ApiError(400, dict field errors) → validation with fieldErrors", () => {
    const err = new ApiError(400, "x", { items: ["too few"], date_start: ["bad", "worse"] });
    expect(normalizeError(err)).toMatchObject({
      kind: "validation",
      fieldErrors: { items: "too few", date_start: "bad" },
    });
  });

  it("ApiError(400, detail) → validation with detail, no fieldErrors", () => {
    const err = new ApiError(400, "x", { detail: "bad" });
    const n = normalizeError(err);
    expect(n).toMatchObject({ kind: "validation", detail: "bad" });
    expect(n.fieldErrors).toBeUndefined();
  });

  it("ApiError(400, non_field_errors) → validation with detail", () => {
    const err = new ApiError(400, "x", { non_field_errors: ["x"] });
    expect(normalizeError(err)).toMatchObject({ kind: "validation", detail: "x" });
  });

  it("ApiError(400, bare array body) → validation with first string as detail", () => {
    const err = new ApiError(400, "x", ["msg1", "msg2"]);
    expect(normalizeError(err)).toMatchObject({ kind: "validation", detail: "msg1" });
  });

  it("ApiError(500) → server", () => {
    expect(normalizeError(new ApiError(500, "x"))).toMatchObject({ kind: "server", status: 500 });
  });

  it("OrderValidationError with dict body → validation + fieldErrors", () => {
    const err = new OrderValidationError("x", { date_start: ["bad date"] });
    expect(normalizeError(err)).toMatchObject({
      kind: "validation",
      fieldErrors: { date_start: "bad date" },
    });
  });

  it("OrderValidationError with only message → validation + detail fallback", () => {
    const err = new OrderValidationError("Quota exceeded", { detail: "Quota exceeded" });
    expect(normalizeError(err)).toMatchObject({
      kind: "validation",
      detail: "Quota exceeded",
    });
  });

  it("TypeError(\"Failed to fetch\") → network", () => {
    expect(normalizeError(new TypeError("Failed to fetch"))).toEqual({
      kind: "network",
      status: null,
    });
  });

  it("AbortError → network", () => {
    const e = new Error("aborted");
    e.name = "AbortError";
    expect(normalizeError(e)).toEqual({ kind: "network", status: null });
  });

  it("Unknown Error → unknown", () => {
    expect(normalizeError(new Error("wat"))).toMatchObject({ kind: "unknown", status: null });
  });
});
