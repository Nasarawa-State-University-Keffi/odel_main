import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";


const backgroundImage = "https://odel.nsuk.edu.ng/wp-content/uploads/2025/07/nsuk-main-entrance-1.jpg";


export const HeroSection = () => {
  return(
    <section
            className="relative flex flex-col items-center justify-center min-h-screen text-center px-6 overflow-hidden"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
              {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
            <div className="relative overflow-hidden bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 text-white">
            
    
              <div className="container relative mx-auto px-4 py-24 md:py-32">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="max-w-4xl mx-auto text-center"
                >
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                    Nasarawa State University Distance Learning Centre Application Portal
                  </h1>
                  <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                    Start your application into Nasarawa State University, Distance Learning Centre here. 
                    We are available to answer all your questions.
                  </p>
    
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/register">
                      <Button
                        size="lg"
                        className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      >
                        Get Started
                      </Button>
                    </Link>
                    
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
  )
}