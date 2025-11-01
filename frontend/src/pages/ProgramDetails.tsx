import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, ArrowLeft, FileText, Info } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const programDetails = {
  "transfer-2026": {
    title: "Application for Transfer Program (2026 A)",
    deadline: "Sun, Nov 9 2025",
    status: "Active",
    description: "Application to transfer from NSUK and other institutions into ODEL.",
    fullDescription: "This program is designed for students who wish to transfer from other institutions into Nasarawa State University Open and Distance Learning Centre. The application process is straightforward and designed to accommodate students with varying academic backgrounds.",
    fee: "10,000.00",
    requirements: [
      "Valid credentials from previous institution",
      "Minimum of 2.0 CGPA from previous institution",
      "Letter of recommendation",
      "Transfer clearance certificate",
    ],
    duration: "Varies based on level of entry",
    modeOfEntry: ["200 Level", "300 Level"],
  },
  "batch-a-2025-2026": {
    title: "2025/2026 Batch A Application",
    deadline: "Sun, Nov 9 2025",
    status: "Active",
    description: "Application into 2025/2026 January session for various programs.",
    fullDescription: "This is a comprehensive application for the 2025/2026 academic session (Batch A) starting in January. The program covers Undergraduate (100 level, Direct Entry, and Conversion), Post Graduate Diploma, and Masters Programs.",
    fee: "10,000.00",
    requirements: [
      "O'Level results (WAEC, NECO, or equivalent)",
      "Birth certificate or age declaration",
      "Valid email address",
      "Passport photographs",
      "Local government identification",
    ],
    duration: "4-5 years for Undergraduate, 1-2 years for Postgraduate",
    modeOfEntry: ["100 Level", "Direct Entry", "Conversion"],
  },
  "public-admin": {
    title: "B.Sc Public Administration",
    deadline: "Sun, Nov 9 2025",
    status: "Active",
    description: "Bachelor of Science in Public Administration program.",
    fullDescription: "Our Public Administration program is designed to equip students with the knowledge and skills necessary for effective public service. The curriculum covers policy analysis, organizational management, public finance, and governance.",
    fee: "10,000.00",
    requirements: [
      "Five O'Level credits including English and Mathematics",
      "UTME requirements or Direct Entry qualifications",
      "Birth certificate",
      "Passport photographs",
    ],
    duration: "4 years (100 Level) or 3 years (Direct Entry)",
    modeOfEntry: ["100 Level", "Direct Entry"],
  },
  "direct-entry": {
    title: "Direct Entry Program",
    deadline: "Sun, Nov 9 2025",
    status: "Active",
    description: "Direct Entry admission for candidates with relevant qualifications.",
    fullDescription: "Direct Entry allows qualified candidates to gain admission into 200 level based on their academic credentials. This is ideal for ND, NCE, or equivalent certificate holders.",
    fee: "10,000.00",
    requirements: [
      "ND, NCE, or equivalent certificate with minimum of Lower Credit",
      "O'Level results",
      "Birth certificate",
      "Letter of recommendation",
    ],
    duration: "3 years",
    modeOfEntry: ["200 Level"],
  },
};

const ProgramDetails = () => {
  const { id } = useParams<{ id: string }>();
  const program = id ? programDetails[id as keyof typeof programDetails] : null;

  if (!program) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Program Not Found</h1>
          <Link to="/programs">
            <Button>Back to Programs</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <Link to="/programs">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Programs
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="border-2">
              <CardContent className="p-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
                  {program.title}
                </h1>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <span className="text-sm text-muted-foreground">Deadline:</span>
                      <p className="font-semibold text-accent">{program.deadline}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-secondary" />
                    <div>
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <p className="font-semibold text-secondary">{program.status}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                    <Info className="h-6 w-6 text-primary" />
                    About This Program
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {program.fullDescription}
                  </p>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    Requirements
                  </h2>
                  <ul className="space-y-2">
                    {program.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="font-semibold mb-2">Duration</h3>
                    <p className="text-muted-foreground">{program.duration}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Mode of Entry</h3>
                    <div className="flex flex-wrap gap-2">
                      {program.modeOfEntry.map((mode, index) => (
                        <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t">
                  <div>
                    <p className="text-3xl font-bold text-primary">NGN {program.fee}</p>
                    <p className="text-sm text-muted-foreground">Application Fee</p>
                  </div>
                  <Link to="/application">
                    <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                      Apply Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProgramDetails;
