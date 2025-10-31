import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { QuickLinks } from "@/components/QuickLinks";
import { AboutSection } from "@/components/AboutSection";
import { FAQSection } from "@/components/FAQSection";
import { EventsSection } from "@/components/EventsSection";
import { CoursesSection } from "@/components/CoursesSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <QuickLinks />
      <AboutSection />
      <FAQSection />
      <EventsSection />
      <CoursesSection />
      <Footer />
    </div>
  );
};

export default Index;
