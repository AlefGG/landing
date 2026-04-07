import { HelmetProvider } from "react-helmet-async";

export default function App() {
  return (
    <HelmetProvider>
      <a href="#main" className="skip-to-content">
        Перейти к содержимому
      </a>
      <main id="main">
        <p>Эко-Ресурс</p>
      </main>
    </HelmetProvider>
  );
}
