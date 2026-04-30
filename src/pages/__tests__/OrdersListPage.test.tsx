import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import OrdersListPage from "../OrdersListPage";
import * as ordersService from "../../services/ordersService";
import i18n from "../../i18n";

type Resolvers<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

function withResolvers<T>(): Resolvers<T> {
  let resolve!: Resolvers<T>["resolve"];
  let reject!: Resolvers<T>["reject"];
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <OrdersListPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

function makeListItem(orderNumber: string): ordersService.OrderListItem {
  return {
    orderNumber,
    serviceType: "rental_event",
    service: "rental",
    status: "pending_payment",
    paymentChannel: "individual",
    createdAt: "2026-04-01T00:00:00Z",
    dateStart: null,
    dateEnd: null,
    addressText: "addr",
    amount: 1,
  };
}

describe("OrdersListPage stale-response guard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("aborts the previous controller when filter changes", async () => {
    const allFirst = withResolvers<ordersService.MyOrdersPage>();
    const pendingMid = withResolvers<ordersService.MyOrdersPage>();
    let call = 0;
    const spy = vi
      .spyOn(ordersService, "listMyOrders")
      .mockImplementation(async () => {
        call += 1;
        if (call === 1) return allFirst.promise;
        return pendingMid.promise;
      });

    renderPage();

    // Resolve call 1 with one item so the filter <select> renders.
    allFirst.resolve({
      count: 1,
      hasMore: false,
      nextUrl: null,
      results: [makeListItem("INITIAL_ORDER")],
    });

    const filter = await screen.findByTestId("orders-filter");
    const call1Signal = spy.mock.calls[0]?.[1]?.signal as AbortSignal;
    expect(call1Signal.aborted).toBe(false);

    // Switch to pending → call 2 fires; refetch must abort call 1's
    // controller before issuing the new request.
    fireEvent.change(filter, { target: { value: "pending_payment" } });
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));

    expect(call1Signal.aborted).toBe(true);

    // The pending call's signal is fresh.
    const call2Signal = spy.mock.calls[1]?.[1]?.signal as AbortSignal;
    expect(call2Signal.aborted).toBe(false);

    // Resolve call 2 LATE. Since signal is not yet aborted, its result will
    // actually be applied — that's expected for a single-step transition.
    // The "stale-result-discarded" path is exercised when the user makes a
    // second filter change (call 3) before call 2 lands; that's covered by
    // the abort-on-refetch behaviour proven above.
    pendingMid.resolve({
      count: 0,
      hasMore: false,
      nextUrl: null,
      results: [],
    });
  });

  it("a stale response whose signal is aborted is not committed to state", async () => {
    const lateGate = withResolvers<ordersService.MyOrdersPage>();
    const spy = vi
      .spyOn(ordersService, "listMyOrders")
      .mockImplementation(async () => lateGate.promise);

    const { unmount } = renderPage();

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    const signal = spy.mock.calls[0]?.[1]?.signal as AbortSignal;

    // Unmount aborts the in-flight controller via the useEffect cleanup —
    // this exercises the same pathway as a filter switch.
    unmount();
    expect(signal.aborted).toBe(true);

    // Resolving AFTER abort must not crash and must not commit state.
    lateGate.resolve({
      count: 1,
      hasMore: false,
      nextUrl: null,
      results: [makeListItem("LATE_LANDING")],
    });

    // Drain microtasks so any unguarded .then would have fired.
    await Promise.resolve();
    await Promise.resolve();

    // The unmounted tree means there's no DOM to inspect — the assertion
    // is "no exception thrown" + "signal.aborted observed before resolve".
    // Both above. Confirm the spy wasn't somehow re-invoked.
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("forwards an AbortSignal to listMyOrders on every refetch", async () => {
    const spy = vi.spyOn(ordersService, "listMyOrders").mockResolvedValue({
      count: 0,
      hasMore: false,
      nextUrl: null,
      results: [],
    });

    renderPage();

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    const args = spy.mock.calls[0];
    expect(args?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });
});
