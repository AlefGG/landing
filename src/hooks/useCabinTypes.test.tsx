// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCabinTypes } from "./useCabinTypes";
import { __resetApiClient } from "../services/apiClient";

beforeEach(() => {
  __resetApiClient();
  vi.stubEnv("VITE_API_URL", "/api");
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("useCabinTypes", () => {
  it("populates types on successful fetch", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => [
        { id: 1, name: "Standard", slug: "standard", description: "", photo: null, block_periods: [] },
      ],
    });
    const { result } = renderHook(() => useCabinTypes("rental"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.types).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("FE-DT-006: forwards AbortSignal to fetch and aborts on unmount", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    let capturedSignal: AbortSignal | undefined;
    fetchMock.mockImplementationOnce((_url: string, init?: RequestInit) => {
      capturedSignal = init?.signal as AbortSignal | undefined;
      return new Promise(() => {
        // never resolves; simulates an in-flight request
      });
    });
    const { unmount } = renderHook(() => useCabinTypes("rental"));
    expect(capturedSignal).toBeDefined();
    expect(capturedSignal!.aborted).toBe(false);
    unmount();
    expect(capturedSignal!.aborted).toBe(true);
  });

  it("FE-DT-006: aborts the previous request when scenario changes", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const signals: AbortSignal[] = [];
    fetchMock.mockImplementation((_url: string, init?: RequestInit) => {
      const s = init?.signal as AbortSignal | undefined;
      if (s) signals.push(s);
      return new Promise(() => {});
    });
    const { rerender } = renderHook(
      ({ scenario }: { scenario: "rental" | "construction" }) => useCabinTypes(scenario),
      { initialProps: { scenario: "rental" } },
    );
    rerender({ scenario: "construction" });
    expect(signals.length).toBeGreaterThanOrEqual(2);
    expect(signals[0]!.aborted).toBe(true);
    expect(signals[1]!.aborted).toBe(false);
  });
});
