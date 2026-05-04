import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SaleItemDetail from "../components/sale/SaleItemDetail";
import { fetchCatalogItem, type SaleItem } from "../services/catalogService";

type LoadState =
  | { status: "loading" }
  | { status: "found"; item: SaleItem }
  | { status: "not-found" }
  | { status: "error"; error: Error };

export default function SaleItemPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  // FE-CQ-001: same hoist as SaleCheckoutPage — initialise to "not-found"
  // when id is missing so the effect body has no synchronous setState.
  const [state, setState] = useState<LoadState>(() =>
    id ? { status: "loading" } : { status: "not-found" },
  );
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchCatalogItem(id)
      .then((item) => {
        if (cancelled) return;
        setState(item ? { status: "found", item } : { status: "not-found" });
      })
      // FE-DT-012: surface fetch errors with a retry path instead of
      // permanent skeleton.
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id, retryToken]);

  if (state.status === "loading") {
    return <div className="min-h-[50vh]" aria-hidden="true" />;
  }
  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-4 text-center"
      >
        <p className="text-lg font-medium text-gray-900">
          {t("catalog.sale.loadError")}
        </p>
        <button
          type="button"
          onClick={() => {
            setState({ status: "loading" });
            setRetryToken((n) => n + 1);
          }}
          className="px-4 py-2 rounded-xl bg-cta-main text-white font-medium"
        >
          {t("errors.retry")}
        </button>
      </div>
    );
  }
  if (state.status === "not-found") {
    return <Navigate to="/sale" replace />;
  }
  return <SaleItemDetail item={state.item} />;
}
