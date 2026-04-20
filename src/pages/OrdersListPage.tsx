import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui";
import OrderCard from "../components/account/OrderCard";
import {
  listMyOrders,
  type OrderListItem,
  type OrderStatus,
} from "../services/ordersService";

const STATUSES: OrderStatus[] = [
  "pending_payment",
  "awaiting_accountant_review",
  "processing",
  "assigned",
  "completed",
  "cancelled",
];

export default function OrdersListPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // BUG-072: push the status filter to the backend via ?status=… so that
  // matching orders on unloaded pages surface too. A client-side filter
  // over page-1 results (20 rows) hides older completed/cancelled orders
  // until the user pages all the way through.
  useEffect(() => {
    let cancelled = false;
    setError(null);
    setOrders(null);
    const statusParam = filter === "all" ? undefined : filter;
    listMyOrders({ page: 1, status: statusParam })
      .then((p) => {
        if (cancelled) return;
        setOrders(p.results);
        setHasMore(p.hasMore);
        setPage(1);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const statusParam = filter === "all" ? undefined : filter;
      const next = await listMyOrders({ page: page + 1, status: statusParam });
      setOrders((prev) => (prev ? [...prev, ...next.results] : next.results));
      setHasMore(next.hasMore);
      setPage((p) => p + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  };

  // Server filters by status already; keep a client-side identity map so
  // the rendered list stays consistent while a refetch is in flight.
  const visible = useMemo(() => orders ?? [], [orders]);

  if (orders === null) {
    return (
      <div className="font-body text-sm text-neutral-500" data-testid="orders-loading">
        …
      </div>
    );
  }

  if (orders.length === 0 && filter === "all") {
    return (
      <div
        className="rounded-[12px] border border-dashed border-neutral-300 bg-white p-10 text-center"
        data-testid="orders-empty"
      >
        {error && (
          <p className="font-body text-sm text-red-600 mb-4">{error}</p>
        )}
        <p className="font-body text-base text-neutral-700 mb-4">
          {t("auth.orders.empty.title")}
        </p>
        <Button variant="cta" size="md" href="/rental">
          {t("auth.orders.empty.cta")}
        </Button>
      </div>
    );
  }

  return (
    <div data-testid="orders-list">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="font-display text-lg font-semibold text-neutral-900">
          {t("auth.orders.title")}
        </h2>
        <label className="flex items-center gap-2 font-body text-sm">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as OrderStatus | "all")}
            className="rounded-[8px] border border-neutral-300 px-3 py-2 bg-white font-body text-sm"
            data-testid="orders-filter"
          >
            <option value="all">{t("auth.orders.filter.all")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`auth.orders.status.${s}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {visible.length === 0 ? (
        <div
          className="rounded-[12px] border border-dashed border-neutral-300 bg-white p-10 text-center"
          data-testid="orders-filtered-empty"
        >
          <p className="font-body text-sm text-neutral-500">
            {t("auth.orders.empty.title")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {visible.map((o) => (
            <OrderCard key={o.orderNumber} order={o} />
          ))}
        </div>
      )}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            size="md"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore
              ? t("auth.orders.loadMoreLoading", { defaultValue: "Загружаем…" })
              : t("auth.orders.loadMore", { defaultValue: "Показать ещё" })}
          </Button>
        </div>
      )}
    </div>
  );
}
