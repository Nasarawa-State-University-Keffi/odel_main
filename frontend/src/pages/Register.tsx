import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import programs from "@/data/programs.json";
import Level from "@/data/Level.json";
import Loader from "@/components/Loader";
import { ProgramAccordion } from "@/components/ProgramAccordion";




const Register = () => {
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [registrationData, setRegistrationData] = useState({
    selectProgram: "",
    modeOfEntry: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationData.modeOfEntry) {
      toast({ title: "Please select mode of entry", variant: "destructive" });
      return;
    }
    if (!registrationData.email || !registrationData.password) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (registrationData.password !== registrationData.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    toast({ title: "Registration successful! Proceed to application." });
    navigate("/complete-profile");
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex flex-col">
      <Header />

      <main className="flex-grow flex items-center justify-center py-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-start"
        >
          {/* Left side — Program List */}
                   <motion.div
                     initial={{ opacity: 0, x: -30 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.2, duration: 0.6 }}
                     className="hidden md:flex flex-col items-start justify-center px-6 text-left space-y-6 bg-muted/10 rounded-2xl p-6 border border-muted/30 shadow-sm"
                   >
                     <h2 className="text-3xl font-bold text-[#f8c201] mb-4">
                       Our Programme List
                     </h2>
         
                     <div className="w-full space-y-4">
                       <ProgramAccordion
                         title="Bachelor's Program"
                         programs={[
                           "BSc. Accounting",
                           "BSc. Business Administration",
                           "BSc. Computer Science",
                           "BSc. Economics",
                           "BSc. International Studies",
                           "BNSc. Nursing Science",
                           "BSc. Political Science",
                           "BSc. Public Administration",
                           "BSc. Sociology",
                           "BSc. Mass Communication",
                           "BSc. Library and Information Science",
                         ]}
                       />
         
                       <ProgramAccordion
                         title="Master's Program"
                         programs={[
                           "Postgraduate Diploma in Management",
                           "Postgraduate Diploma in Education",
                           "Master in Public Administration",
                           "Master in International Affairs and Diplomacy",
                           "Master in Public Health",
                           "Master in Law Enforcement and Criminal Justice",
                           "Master in Information Management",
                           "Master in Business Administration",
                           "Master in Accounting",
                           "Master in Disaster and Risk Management",
                         ]}
                       />
                     </div>
                   </motion.div>

          {/* Right Side — Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Card className="p-8 shadow-lg border border-muted/50 backdrop-blur-lg bg-card/80">
              <form onSubmit={handleRegistration} className="space-y-4">
                {/* Program Selection */}
                <Select
                  value={registrationData.selectProgram}
                  onValueChange={(value) =>
                    setRegistrationData({ ...registrationData, selectProgram: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Program" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(programs) &&
                      programs
                        .filter((p: any) => p.status?.toLowerCase() === "active")
                        .map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.title}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>

                {/* Mode of Entry */}
                <Select
                  value={registrationData.modeOfEntry}
                  onValueChange={(value) =>
                    setRegistrationData({ ...registrationData, modeOfEntry: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mode of Entry" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(Level) &&
                      Level.map((level: any) => (
                        <SelectItem key={level.id} value={String(level.id)}>
                          {level.level}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* Email */}
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={registrationData.email}
                  onChange={(e) =>
                    setRegistrationData({ ...registrationData, email: e.target.value })
                  }
                />

                {/* Password */}
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={registrationData.password}
                    onChange={(e) =>
                      setRegistrationData({ ...registrationData, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={registrationData.confirmPassword}
                    onChange={(e) =>
                      setRegistrationData({ ...registrationData, confirmPassword: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Login Link */}
                <p className="text-sm text-center text-muted-foreground mt-2">
                  Already registered?{" "}
                  <a href="/login" className="text-primary hover:underline">
                    Login
                  </a>
                </p>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-accent text-[#fff] hover:bg-accent/90"
                >
                  Proceed
                </Button>
              </form>
            </Card>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;
