import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import SaleCheckout from "../components/sale/SaleCheckout";
import { fetchCatalogItem, type SaleItem } from "../services/catalogService";

type LoadState =
  | { status: "loading" }
  | { status: "found"; item: SaleItem }
  | { status: "not-found" };

export default function SaleCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  // FE-CQ-001: hoist the missing-id early-out out of the effect to avoid
  // synchronous setState during effect body. The valid-id path stays in
  // the effect; setState there fires from a .then() (microtask) which the
  // lint rule does not flag.
  const [state, setState] = useState<LoadState>(() =>
    id ? { status: "loading" } : { status: "not-found" },
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchCatalogItem(id).then((item) => {
      if (cancelled) return;
      setState(item ? { status: "found", item } : { status: "not-found" });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.status === "loading") {
    return <div className="min-h-[50vh]" aria-hidden="true" />;
  }
  if (state.status === "not-found") {
    return <Navigate to="/sale" replace />;
  }
  return <SaleCheckout item={state.item} />;
}
