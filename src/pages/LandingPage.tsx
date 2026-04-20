import Seo from "../components/Seo";
import Hero from "../components/Hero";
import StatsBanner from "../components/StatsBanner";
import Services from "../components/Services";
import About from "../components/About";
import Partners from "../components/Partners";
import Events from "../components/Events";
import Advantages from "../components/Advantages";
import Cabins from "../components/Cabins";
import CtaBanner from "../components/CtaBanner";
import Faq from "../components/Faq";

export default function LandingPage() {
  return (
    <>
      <Seo />
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
    </>
  );
}
