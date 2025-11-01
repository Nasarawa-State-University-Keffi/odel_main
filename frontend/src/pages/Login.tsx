import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, LogIn, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Loader from "@/components/Loader";
import { ProgramAccordion } from "@/components/ProgramAccordion";


const Login = () => {
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    toast({ title: "Login Successful! Redirecting to dashboard..." });
    navigate("/dashboard");
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
          className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center"
        >
          {/* Left side — Program List */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="hidden md:flex flex-col items-start justify-center px-6 text-left space-y-6 bg-muted/10 rounded-2xl p-6 border border-muted/30 shadow-sm"
          >
            <h2 className="text-3xl font-bold text-[#F8C201] mb-4">
              Our Programme List
            </h2>

            <div className="w-full space-y-4 text-[#F8C201]">
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

          {/* Right side — Login form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Card className="p-8 shadow-lg border border-muted/50 backdrop-blur-lg bg-card/80">
              <h1 className="text-2xl font-bold mb-6 text-center text-[#F8C201]">
                Sign In
              </h1>

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                  className="focus-visible:ring-primary/40"
                />

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    className="focus-visible:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <a
                    href="#"
                    className="text-sm text-[#F8C201] hover:underline transition-colors"
                  >
                    Forgot Password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent text-[#fff] hover:bg-accent/90 flex items-center justify-center rounded-md gap-2"
                >
                  <LogIn size={18} />
                  Sign In
                </Button>

                <p className="text-sm text-center text-muted-foreground mt-4">
                  Don’t have an account?{" "}
                  <a
                    href="/register"
                    className="text-primary font-medium hover:underline"
                  >
                    Register here
                  </a>
                </p>
              </form>
            </Card>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
