import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, InlineError, PageError } from "../components/ui";
import OrderCard from "../components/account/OrderCard";
import {
  normalizeError,
  type NormalizedError,
} from "../services/errors";
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
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [loadError, setLoadError] = useState<NormalizedError | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<NormalizedError | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // FE-DT-008: aborts the in-flight refetch on filter change so a stale
  // response can't render under a fresh filter label.
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoadError(null);
    setOrders(null);
    const statusParam = filter === "all" ? undefined : filter;
    listMyOrders({ page: 1, status: statusParam }, { signal: controller.signal })
      .then((p) => {
        if (controller.signal.aborted) return;
        setOrders(p.results);
        setHasMore(p.hasMore);
        setPage(1);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const normalized = normalizeError(err);
        if (normalized.kind === "auth") {
          navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
          return;
        }
        setLoadError(normalized);
        setOrders([]);
      });
  }, [filter, location.pathname, navigate]);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    // Snapshot the filter at call time. If the user changes the filter while
    // page+1 is in flight, the resolution path drops the result.
    const filterAtCallTime = filter;
    try {
      const statusParam =
        filterAtCallTime === "all" ? undefined : filterAtCallTime;
      const next = await listMyOrders({ page: page + 1, status: statusParam });
      if (filter !== filterAtCallTime) return;
      setOrders((prev) => (prev ? [...prev, ...next.results] : next.results));
      setHasMore(next.hasMore);
      setPage((p) => p + 1);
    } catch (err) {
      if (filter !== filterAtCallTime) return;
      setLoadMoreError(normalizeError(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const visible = useMemo(() => orders ?? [], [orders]);

  if (loadError) {
    return (
      <PageError
        error={loadError}
        overrideKey="errors.ordersList"
        onRetry={refetch}
      />
    );
  }

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
        <div className="mt-6 flex flex-col items-center gap-2">
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
          {loadMoreError && <InlineError error={loadMoreError} />}
        </div>
      )}
    </div>
  );
}
