// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const captureExceptionMock = vi.fn();
vi.mock("@sentry/react", () => ({
  captureException: (...args: unknown[]) => captureExceptionMock(...args),
}));

import {
  __resetApiClient,
  fetchValidated,
  SchemaMismatchError,
  SCHEMA_VALIDATION_MODE,
} from "../apiClient";

const TestSchema = z
  .object({ id: z.number(), name: z.string() })
  .describe("TestSchema");

beforeEach(() => {
  __resetApiClient();
  vi.stubGlobal("fetch", vi.fn());
  captureExceptionMock.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchValidated", () => {
  it("happy path: returns parsed data when schema matches", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 1, name: "Alice" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const result = await fetchValidated("/test/", TestSchema);
    expect(result).toEqual({ id: 1, name: "Alice" });
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("warn mode: schema mismatch logs to Sentry and returns raw cast", async () => {
    if (SCHEMA_VALIDATION_MODE !== "warn") {
      // The constant is build-time; in tests we expect the default warn.
      return;
    }
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "not-a-number", name: 42 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const result = await fetchValidated("/test/", TestSchema);
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    const [err, ctx] = captureExceptionMock.mock.calls[0]!;
    expect(err).toBeInstanceOf(SchemaMismatchError);
    expect((err as SchemaMismatchError).path).toBe("/test/");
    expect((err as SchemaMismatchError).schemaName).toBe("TestSchema");
    expect((ctx as { tags?: Record<string, unknown> })?.tags).toMatchObject({
      kind: "schema-mismatch",
      path: "/test/",
    });
    // Raw body returned unchanged (legacy behaviour).
    expect(result).toEqual({ id: "not-a-number", name: 42 });
  });

  it("SchemaMismatchError carries zod issues array", async () => {
    const err = new SchemaMismatchError("/x/", "X", [
      { code: "invalid_type", path: ["a"], message: "expected string" } as never,
    ]);
    expect(err.issues).toHaveLength(1);
    expect(err.name).toBe("SchemaMismatchError");
  });
});
