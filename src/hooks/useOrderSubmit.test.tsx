// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import type { ReactNode } from "react";
import i18n from "../i18n";
import { useOrderSubmit } from "./useOrderSubmit";

const mockUseAuth = vi.fn();
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </MemoryRouter>
  );
}

const validContacts = {
  contactType: "individual" as const,
  name: "Alice",
  phone: "87001234567",
  email: "",
};

describe("useOrderSubmit", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("sets pendingAuth=true when not authenticated and contacts valid", async () => {
    mockUseAuth.mockReturnValue({ status: "anonymous" });
    const buildOrder = vi.fn();
    const { result } = renderHook(
      () => useOrderSubmit({ contacts: validContacts, buildOrder }),
      { wrapper },
    );
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.pendingAuth).toBe(true);
    expect(buildOrder).not.toHaveBeenCalled();
  });

  it("does not set pendingAuth when contacts invalid", async () => {
    mockUseAuth.mockReturnValue({ status: "anonymous" });
    const buildOrder = vi.fn();
    const { result } = renderHook(
      () =>
        useOrderSubmit({
          contacts: { ...validContacts, name: "" },
          buildOrder,
        }),
      { wrapper },
    );
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.pendingAuth).toBe(false);
  });

  it("auto-triggers buildOrder when authStatus flips to authenticated", async () => {
    let status: "anonymous" | "authenticated" = "anonymous";
    mockUseAuth.mockImplementation(() => ({ status }));
    const buildOrder = vi.fn().mockResolvedValue({ order_number: "X-1" });
    const { result, rerender } = renderHook(
      () => useOrderSubmit({ contacts: validContacts, buildOrder }),
      { wrapper },
    );
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.pendingAuth).toBe(true);

    status = "authenticated";
    await act(async () => {
      rerender();
    });
    await waitFor(() => expect(buildOrder).toHaveBeenCalledTimes(1));
  });

  it("cancelPendingAuth resets pendingAuth state", async () => {
    mockUseAuth.mockReturnValue({ status: "anonymous" });
    const { result } = renderHook(
      () => useOrderSubmit({ contacts: validContacts, buildOrder: vi.fn() }),
      { wrapper },
    );
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.pendingAuth).toBe(true);
    act(() => result.current.cancelPendingAuth());
    expect(result.current.pendingAuth).toBe(false);
  });

  it("calls onPendingAuthChange callback", async () => {
    mockUseAuth.mockReturnValue({ status: "anonymous" });
    const onPendingAuthChange = vi.fn();
    const { result } = renderHook(
      () =>
        useOrderSubmit({
          contacts: validContacts,
          buildOrder: vi.fn(),
          onPendingAuthChange,
        }),
      { wrapper },
    );
    await act(async () => {
      await result.current.submit();
    });
    expect(onPendingAuthChange).toHaveBeenCalledWith(true);
  });

  it("authenticated user: submit calls buildOrder directly without pendingAuth", async () => {
    mockUseAuth.mockReturnValue({ status: "authenticated" });
    const buildOrder = vi.fn().mockResolvedValue({ order_number: "X-1" });
    const { result } = renderHook(
      () => useOrderSubmit({ contacts: validContacts, buildOrder }),
      { wrapper },
    );
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.pendingAuth).toBe(false);
    expect(buildOrder).toHaveBeenCalledTimes(1);
  });
});
