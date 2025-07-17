import Header from "@/components/Header";
import DynamicHero from "@/components/DynamicHero";
import Features from "@/components/Features";
import DynamicPricing from "@/components/DynamicPricing";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <DynamicHero />
      <Features />
      <DynamicPricing />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Index;
