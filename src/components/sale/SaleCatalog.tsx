import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import WizardHero from "../wizards/shared/WizardHero";
import Seo from "../Seo";
import SaleItemCard from "./SaleItemCard";
import { fetchCatalog, type SaleItem } from "../../services/catalogService";

// FE-DT-013: discriminated union over the four catalog-load states so the
// UI never sits in an indistinguishable empty grid on a backend failure.
type LoadState =
  | { status: "loading" }
  | { status: "loaded"; items: SaleItem[] }
  | { status: "error"; error: Error }
  | { status: "empty" };

export default function SaleCatalog() {
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchCatalog()
      .then((data) => {
        if (cancelled) return;
        setState(
          data.length === 0
            ? { status: "empty" }
            : { status: "loaded", items: data },
        );
      })
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
  }, [retryToken]);

  return (
    <div className="bg-white overflow-x-clip">
      <Seo pageKey="sale" />
      <WizardHero title={t("catalog.sale.title")} />

      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6 lg:py-12">
        {state.status === "loading" && (
          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6"
            aria-busy="true"
            aria-live="polite"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl bg-gray-100 animate-pulse min-h-[280px]"
              />
            ))}
          </div>
        )}
        {state.status === "error" && (
          <div
            role="alert"
            className="min-h-[40vh] flex flex-col items-center justify-center gap-4 text-center"
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
        )}
        {state.status === "empty" && (
          <div className="min-h-[40vh] flex items-center justify-center text-center text-gray-700">
            {t("catalog.sale.empty")}
          </div>
        )}
        {state.status === "loaded" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {state.items.map((item) => (
              <Link
                key={item.id}
                to={`/sale/${item.id}`}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-main rounded-3xl"
              >
                <SaleItemCard item={item} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
