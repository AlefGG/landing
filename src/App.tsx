import { HelmetProvider } from "react-helmet-async";
import Header from "./components/Header";
import Hero from "./components/Hero";
import StatsBanner from "./components/StatsBanner";

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
      </main>
    </HelmetProvider>
  );
}
