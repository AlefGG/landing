import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import RequireAuth from "./components/auth/RequireAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";

// FE-PF-007: LandingPage joins the lazy bundle. Previously the static
// import pulled the entire landing-section subtree (Hero / Services /
// About / Partners / Events / Advantages / Cabins / CtaBanner / Faq /
// StatsBanner) into the entry chunk, costing every non-`/` first-load
// ~50–80 KB raw of unused JS. With this split the Suspense boundary
// already in App.tsx renders RouteFallback for ~50 ms while the
// LandingPage chunk fetches on `/`.
const LandingPage = lazy(() => import("./pages/LandingPage"));
const ServicePage = lazy(() => import("./pages/ServicePage"));
const RentalPage = lazy(() => import("./pages/RentalPage"));
const SalePage = lazy(() => import("./pages/SalePage"));
const SaleItemPage = lazy(() => import("./pages/SaleItemPage"));
const SaleCheckoutPage = lazy(() => import("./pages/SaleCheckoutPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const SuccessPage = lazy(() => import("./pages/SuccessPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const VerifyPage = lazy(() => import("./pages/VerifyPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const OrdersListPage = lazy(() => import("./pages/OrdersListPage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

/**
 * Resets ErrorBoundary state when the URL pathname changes. Without this
 * an error caught on /rental keeps the UI in error mode even after the
 * user clicks the logo to go to "/" — React boundaries only reset when
 * their key changes or they unmount.
 */
function RouteResetBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
}

function RouteFallback() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="min-h-[60vh] flex items-center justify-center"
    >
      <span className="inline-block size-10 rounded-full border-4 border-neutral-200 border-t-cta-main animate-spin" />
    </div>
  );
}

export default function App() {
  const { t } = useTranslation();

  return (
    <HelmetProvider>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AuthProvider>
            <a href="#main" className="skip-to-content">
              {t("a11y.skipToContent")}
            </a>
            <Header />
            <main id="main">
              <RouteResetBoundary>
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                  <Route path="/" element={<LandingPage />} />
                  {/* PR-12: /service is the new canonical path; /sanitation
                      kept as a duplicate-route alias for backwards-compat
                      with deep links until at least one release after
                      drop-out. Both render the same page component. */}
                  <Route path="/service" element={<ServicePage />} />
                  <Route path="/sanitation" element={<ServicePage />} />
                  <Route path="/rental" element={<RentalPage />} />
                  <Route path="/sale" element={<SalePage />} />
                  <Route path="/sale/:id" element={<SaleItemPage />} />
                  <Route path="/sale/:id/checkout" element={<SaleCheckoutPage />} />
                  <Route path="/orders/:orderId/pay" element={<PaymentPage />} />
                  <Route path="/success" element={<SuccessPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/verify" element={<VerifyPage />} />
                  <Route
                    path="/account"
                    element={
                      <RequireAuth>
                        <AccountPage />
                      </RequireAuth>
                    }
                  >
                    <Route index element={<Navigate to="orders" replace />} />
                    <Route path="orders" element={<OrdersListPage />} />
                    <Route path="orders/:id" element={<OrderDetailPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                  </Route>
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                </Suspense>
              </RouteResetBoundary>
            </main>
            <Footer />
          </AuthProvider>
        </BrowserRouter>
      </MotionConfig>
    </HelmetProvider>
  );
}
