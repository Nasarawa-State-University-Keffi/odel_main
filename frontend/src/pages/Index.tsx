import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Calendar, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import programs from "@/data/programs.json" // fetching all available programs from the json file




const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}

      <HeroSection />

      {/* Disclaimer Section */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-l-4 border-l-destructive bg-destructive/5">
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-destructive mb-2">Disclaimer</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      ODEL does not engage third-party agents to interact with students for and on its behalf. Application and school fees are paid exclusively through our portals. NSUK liaison officers are available to guide you through course registration. Note that ODEL would bear no liability should you pay any money to anybody, or through any medium other than as advised here. If you require further clarification or support please reach out to us at admissions@odel.nsuk.edu.ng or +234 (0908) 748-2267.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Available Programs</h2>
            <p className="text-muted-foreground">Choose from our available application programs</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
            {programs.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4 text-primary">{program.title}</h3>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Deadline:</span>
                        <span className="font-semibold text-accent">{program.deadline}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        <span className="text-muted-foreground">Application Status:</span>
                        <span className="font-semibold text-secondary">{program.status}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                      {program.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-primary">NGN {program.fee}</p>
                        <p className="text-xs text-muted-foreground">Fee</p>
                      </div>
                      <Link to={`/program/${program.id}`}>
                        <Button className="bg-[#f8c201] text-[#fff] hover:bg-[#f8c201]/90">
                          View More
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link to="/programs">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                See More Programs
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How To Apply</h2>
            <p className="text-muted-foreground">Simple steps to get started</p>
          </motion.div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting Lines - Desktop */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent mx-[10%]" />
            <div className="hidden md:flex absolute top-8 left-0 right-0 justify-between mx-[10%] px-[5%]">
              <div className="w-3 h-3 rounded-full bg-primary -mt-1.5" />
              <div className="w-3 h-3 rounded-full bg-secondary -mt-1.5" />
              <div className="w-3 h-3 rounded-full bg-accent -mt-1.5" />
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              {[
                { step: "01", title: "Create an Account", description: "Register with your email and basic information", color: "from-primary to-primary/80" },
                { step: "02", title: "Choose Program", description: "Select your preferred program and mode of entry", color: "from-secondary to-secondary/80" },
                { step: "03", title: "Complete Application", description: "Fill in your details and submit your application", color: "from-accent to-accent/80" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center relative"
                >
                  {/* Mobile Connecting Line */}
                  {index < 2 && (
                    <div className="md:hidden absolute left-1/2 top-16 w-0.5 h-8 bg-gradient-to-b from-primary to-secondary -translate-x-1/2" />
                  )}
                  
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${item.color} text-white text-2xl font-bold mb-4 shadow-lg relative z-10`}>
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
