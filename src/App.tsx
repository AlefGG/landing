import { HelmetProvider } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { MotionConfig } from "framer-motion";
import Seo from "./components/Seo";
import Header from "./components/Header";
import Hero from "./components/Hero";
import StatsBanner from "./components/StatsBanner";
import Services from "./components/Services";
import About from "./components/About";
import Partners from "./components/Partners";
import Events from "./components/Events";
import Advantages from "./components/Advantages";
import Cabins from "./components/Cabins";
import CtaBanner from "./components/CtaBanner";
import Faq from "./components/Faq";
import Footer from "./components/Footer";

export default function App() {
  const { t } = useTranslation();

  return (
    <HelmetProvider>
      <MotionConfig reducedMotion="user">
        <Seo />
        <a href="#main" className="skip-to-content">
          {t("a11y.skipToContent")}
        </a>
        <Header />
        <main id="main">
          <Hero />
          <StatsBanner />
          <Services />
          <About />
          <Partners />
          <Events />
          <Advantages />
          <Cabins />
          <CtaBanner />
          <Faq />
        </main>
        <Footer />
      </MotionConfig>
    </HelmetProvider>
  );
}
