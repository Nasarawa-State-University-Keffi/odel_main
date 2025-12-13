import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Eye, EyeOff, Mail, Lock, User, Phone, Menu } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import ActiveAdmission from "@/components/shared/ActiveAdmission";
import ActiveProgrammes from "@/components/shared/ActiveProgrammes";
import CourseList from "@/components/shared/CourseList";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Loader } from "@/components/ui/loader";
import odelLogo from '@/assets/odel-logo.jpg';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<number | null>(null);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    controls.start({ opacity: 1, y: 0 });
  }, [controls]);

  // HANDLLES THE FORM SHAKING AT WRONG CREDENTIALS

  const shakeForm = () => {
    controls.start({
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 }
    });
  };

  // HANDLES STUDENT REGISTRATIONS

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAdmissionId) {
      toast({
        title: "Missing Selection",
        description: "Please select an admission cycle.",
        variant: "destructive",
      });
      shakeForm();
      return;
    }

    if (!selectedProgrammeId) {
      toast({
        title: "Missing Selection",
        description: "Please select a programme.",
        variant: "destructive",
      });
      shakeForm();
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      toast({
        title: "Password Mismatch",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      });
      shakeForm();
      setFormData({ ...formData, password: "", confirmPassword: "" });
      return;
    }

    if (formData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      shakeForm();
      setFormData({ ...formData, password: "", confirmPassword: "" });
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      shakeForm();
      return;
    }

    setPasswordError("");
    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        admissionId: selectedAdmissionId,
        programmeId: selectedProgrammeId,
      };

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, submitData);

      if (response.status === 201) {
        toast({
          title: "Registration Successful",
          description: "Your account has been created. Please login.",
        });
        navigate("/api/auth/login");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.message || "Registration failed. Please try again.";
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      shakeForm();
      setFormData({ ...formData, password: "", confirmPassword: "" });
    } finally {
      setIsSubmitting(false);
    }
  };


  // HANDLES INPUT CHANGE

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background">
      {/* Left Panel - Course List (Desktop) */}
      <div className="hidden lg:flex w-1/3 bg-muted/30 p-6 border-r h-full flex-col overflow-hidden">
        <CourseList />
      </div>

      {/* Main Panel - Registration Form */}
      <div className="flex-1 relative flex flex-col h-full overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
        {/* Mobile Header with Course List Toggle */}
        <div className="lg:hidden absolute top-4 left-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="bg-background/80 backdrop-blur-sm shadow-sm gap-2">
                <Menu className="h-4 w-4" />
                Available Programmes
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-6 w-[85vw] sm:w-[400px]">
              <CourseList />
            </SheetContent>
          </Sheet>
        </div>

        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none z-0" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none z-0" />

        <div className="relative z-10 w-full min-h-full flex flex-col items-center justify-start pt-20 pb-8 px-4 sm:pt-6 sm:pb-6 sm:px-6 lg:p-10 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl my-auto"
          >
            <Card className="w-full rounded-xl border border-border/50 shadow-2xl bg-card/95 backdrop-blur-sm flex flex-col sm:block">
              <CardHeader>
                <CardTitle className="text-center text-2xl font-semibold">
                  <div className="mb-4 flex items-center justify-center gap-2">
                    <div className="inline-flex items-center justify-center mb-4">
                      <img src={odelLogo} alt="ODEL Logo" className="h-16" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    Create Account
                  </div>
                </CardTitle>
                <p className="text-center text-muted-foreground">
                  Start your academic journey with us today
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div className="space-y-2">
                      <FloatingInput
                        id="firstName"
                        name="firstName"
                        label="First Name"
                        icon={<User className="h-4 w-4" />}
                        className="bg-background/50"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <FloatingInput
                        id="lastName"
                        name="lastName"
                        label="Last Name"
                        icon={<User className="h-4 w-4" />}
                        className="bg-background/50"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <FloatingInput
                      id="email"
                      name="email"
                      label="Email"
                      type="email"
                      icon={<Mail className="h-4 w-4" />}
                      className="bg-background/50"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <FloatingInput
                      id="phoneNumber"
                      name="phoneNumber"
                      label="Phone Number"
                      icon={<Phone className="h-4 w-4" />}
                      className="bg-background/50"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Admission & Programme Selection */}
                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <h3 className="text-sm font-medium text-foreground mb-4">Academic Selection</h3>
                      <div className="space-y-4">
                        <ActiveAdmission
                          onSelect={setSelectedAdmissionId}
                          selectedId={selectedAdmissionId}
                        />
                        <ActiveProgrammes
                          onSelect={setSelectedProgrammeId}
                          selectedId={selectedProgrammeId}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Password */}
                    <div className="space-y-2">
                      <div className="relative">
                        <FloatingInput
                          id="password"
                          name="password"
                          label="Password"
                          type={showPassword ? "text" : "password"}
                          icon={<Lock className="h-4 w-4" />}
                          className="bg-background/50 pr-10"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors z-20"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <FloatingInput
                        id="confirmPassword"
                        name="confirmPassword"
                        label="Confirm Password"
                        type={showPassword ? "text" : "password"}
                        icon={<Lock className="h-4 w-4" />}
                        className="bg-background/50 pr-10"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {passwordError && (
                    <p className="text-sm text-destructive text-center">{passwordError}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full font-bold py-6 shadow-lg transition-all"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Register"
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex justify-center text-sm text-muted-foreground pb-8">
                Already a Student?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/api/auth/login")}
                  className="text-primary hover:underline ml-1 transition-colors"
                >
                  Login here
                </button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;