import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import WizardHero from "../wizards/shared/WizardHero";
import Seo from "../Seo";
import SaleItemCard from "./SaleItemCard";
import { fetchCatalog, type SaleItem } from "../../services/catalogService";

export default function SaleCatalog() {
  const { t } = useTranslation();
  const [items, setItems] = useState<SaleItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchCatalog().then((data) => {
      if (!cancelled) setItems(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white overflow-x-clip">
      <Seo pageKey="sale" />
      <WizardHero title={t("catalog.sale.title")} />

      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/sale/${item.id}`}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-main rounded-3xl"
            >
              <SaleItemCard item={item} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
