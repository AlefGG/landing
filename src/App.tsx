import { HelmetProvider } from "react-helmet-async";
import Header from "./components/Header";

export default function App() {
  return (
    <HelmetProvider>
      <a href="#main" className="skip-to-content">
        Перейти к содержимому
      </a>
      <Header />
      <main id="main">{/* Sections will be added here */}</main>
    </HelmetProvider>
  );
}
