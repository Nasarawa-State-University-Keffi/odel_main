import { Button } from "./ui/button";

export const AboutSection = () => {
  return (
    <section id="about" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="relative text-3xl md:text-4xl font-bold mb-6 text-center">
          About Us
          <span className="absolute left-1/2 -bottom-2 w-24 h-1 bg-[#F8C301] -translate-x-1/2"></span>
        </h2>
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            Nasarawa State University, Keffi was established in 2001 under the Nasarawa State Law No. 2 of 2001as passed by the stated House of Assembly. The university was founded upon the philosophy of the, “believe in excellence, creativity, productivity and freedom of conscience for the advancement of individual and humanity.” The mandate of the university is to pursue and foster “knowledge for development”. In line with the vision, thoughts and aspirations of the founding fathers of the university, the current administration seeks to make Nasarawa State University a 21st-century academic giant and pacesetter in teaching, research and innovation 
            tailored towards people-oriented community service national development, global visibility and...
          </p>
          
          <div className="text-center">
            <Button variant="outline" size="lg" className="font-semibold">
              Read More About Us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
