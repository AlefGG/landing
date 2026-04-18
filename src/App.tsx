import { HelmetProvider } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Seo from "./components/Seo";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import SanitationPage from "./pages/SanitationPage";
import RentalPage from "./pages/RentalPage";
import SalePage from "./pages/SalePage";
import SaleItemPage from "./pages/SaleItemPage";
import SaleCheckoutPage from "./pages/SaleCheckoutPage";
import PaymentPage from "./pages/PaymentPage";
import SuccessPage from "./pages/SuccessPage";
import LoginPage from "./pages/LoginPage";
import VerifyPage from "./pages/VerifyPage";
import AccountPage from "./pages/AccountPage";
import OrdersListPage from "./pages/OrdersListPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ProfilePage from "./pages/ProfilePage";
import RequireAuth from "./components/auth/RequireAuth";
import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  const { t } = useTranslation();

  return (
    <HelmetProvider>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AuthProvider>
            <Seo />
            <a href="#main" className="skip-to-content">
              {t("a11y.skipToContent")}
            </a>
            <Header />
            <main id="main">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/sanitation" element={<SanitationPage />} />
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
              </Routes>
            </main>
            <Footer />
          </AuthProvider>
        </BrowserRouter>
      </MotionConfig>
    </HelmetProvider>
  );
}
