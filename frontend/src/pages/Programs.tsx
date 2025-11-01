import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const allPrograms = [
  {
    id: "transfer-2026",
    title: "Application for Transfer Program (2026 A)",
    deadline: "Sun, Nov 9 2025",
    status: "Active",
    description: "Application to transfer from ABU and other institutions into ODEL. Ensure you meet the requirements for your chosen course before you pay. Application fee paid is not refundable.",
    fee: "10,000.00",
  },
  {
    id: "batch-a-2025-2026",
    title: "2025/2026 Batch A Application",
    deadline: "Sun, Nov 9 2025",
    status: "Active",
    description: "Application into 2025/2026 January session (2025/2026 batch A) for Undergraduate(100level, Direct Entry and Conversion), Post Graduate Diploma and Masters Program.",
    fee: "10,000.00",
  },
  {
    id: "public-admin",
    title: "B.Sc Public Administration",
    deadline: "Sun, Nov 9 2025",
    status: "Active",
    description: "Bachelor of Science in Public Administration program. This program prepares students for careers in public service and administration.",
    fee: "10,000.00",
  },
  {
    id: "direct-entry",
    title: "Direct Entry Program",
    deadline: "Sun, Nov 9 2025",
    status: "Active",
    description: "Direct Entry admission for candidates with relevant qualifications. Skip to 200 level based on your credentials.",
    fee: "10,000.00",
  },
];

const Programs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">All Programs</h1>
            <p className="text-muted-foreground text-lg">Browse all available application programs</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {allPrograms.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                        <span className="text-muted-foreground">Status:</span>
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
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Programs;
