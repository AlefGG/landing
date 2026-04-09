import { HelmetProvider } from "react-helmet-async";
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
  return (
    <HelmetProvider>
      <a href="#main" className="skip-to-content">
        Перейти к содержимому
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
    </HelmetProvider>
  );
}
