import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import SaleItemDetail from "../components/sale/SaleItemDetail";
import { fetchCatalogItem, type SaleItem } from "../services/catalogService";

type LoadState =
  | { status: "loading" }
  | { status: "found"; item: SaleItem }
  | { status: "not-found" };

export default function SaleItemPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!id) {
      setState({ status: "not-found" });
      return;
    }
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
  return <SaleItemDetail item={state.item} />;
}
