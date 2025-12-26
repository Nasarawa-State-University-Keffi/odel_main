import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Eye, EyeOff, Mail, Lock, User, Phone, Menu, Loader2 } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api";
import ActiveAdmission from "@/components/shared/ActiveAdmission";
import CourseList from "@/components/shared/CourseList";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
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

  // VALIDATION FUNCTION
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.firstName.trim()) newErrors.firstName = "First Name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone Number is required";
    if (!selectedAdmissionId) {
      toast({
        title: "Missing Selection",
        description: "Please select an admission cycle.",
        variant: "destructive",
      });
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return isValid && Object.keys(newErrors).length === 0;
  };

  // HANDLES STUDENT REGISTRATIONS
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      shakeForm();
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        admissionId: selectedAdmissionId,
      };

      await apiClient.post("/v2/application/register", submitData);

      toast({
        title: "Registration Successful",
        description: "Your account has been created. Please login.",
      });

      navigate("/api/auth/login");

    } catch (error: any) {
      // FIELD-SPECIFIC SERVER ERROR
      if (
        error.message?.toLowerCase().includes("phone")
      ) {
        setErrors(prev => ({ ...prev, phoneNumber: error.message }));
        return;
      }

      if (error.message?.toLowerCase().includes("email")) {
        setErrors(prev => ({ ...prev, email: error.message }));
        return;
      }

      // GENERIC SERVER FAILURE
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });

      shakeForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  // HANDLES INPUT CHANGE
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for the field being edited
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background">
      {/* Left Panel - Course List (Desktop) */}
      <div className="hidden lg:flex w-1/3 bg-background border-r border-border/50 h-full flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-primary/5 z-0" />
        <div className="relative z-10 p-6 h-full overflow-y-auto">
          <CourseList />
        </div>
      </div>

      {/* Main Panel - Registration Form */}
      <div className="flex-1 relative flex flex-col h-full overflow-y-auto bg-background">
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
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none z-0" />

        <div className="relative z-10 w-full min-h-full flex flex-col items-center justify-start pt-20 pb-8 px-4 sm:pt-6 sm:pb-6 sm:px-6 lg:p-10 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl my-auto"
          >
            <Card className="w-full rounded-3xl border-border/50 shadow-2xl bg-card/60 backdrop-blur-xl flex flex-col sm:block overflow-hidden">
              <CardHeader className="pt-8 pb-6 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative mb-6 inline-flex justify-center"
                >
                  <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full" />
                  <img src={odelLogo} alt="ODEL Logo" className="relative h-20 w-auto rounded-2xl border-2 border-background shadow-lg" />
                </motion.div>
                <CardTitle className="flex flex-col gap-2">
                  <span className="block text-3xl font-black tracking-tighter text-foreground uppercase">
                    Create Account
                  </span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                    Begin Your Journey
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="px-8 pb-8">
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div className="space-y-2 group">
                      <FloatingInput
                        id="firstName"
                        name="firstName"
                        label="First Name"
                        disabled={isSubmitting}
                        icon={<User className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />}
                        className="bg-background/40 border-border/50 h-14 rounded-2xl group-focus-within:border-primary/50 group-focus-within:ring-primary/20"
                        value={formData.firstName}
                        onChange={handleChange}
                        error={errors.firstName}
                        required
                      />
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2 group">
                      <FloatingInput
                        id="lastName"
                        name="lastName"
                        label="Last Name"
                        disabled={isSubmitting}
                        icon={<User className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />}
                        className="bg-background/40 border-border/50 h-14 rounded-2xl group-focus-within:border-primary/50 group-focus-within:ring-primary/20"
                        value={formData.lastName}
                        onChange={handleChange}
                        error={errors.lastName}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2 group">
                    <FloatingInput
                      id="email"
                      name="email"
                      label="Email"
                      type="email"
                      disabled={isSubmitting}
                      icon={<Mail className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />}
                      className="bg-background/40 border-border/50 h-14 rounded-2xl group-focus-within:border-primary/50 group-focus-within:ring-primary/20"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2 group">
                    <FloatingInput
                      id="phoneNumber"
                      name="phoneNumber"
                      label="Phone Number"
                      disabled={isSubmitting}
                      icon={<Phone className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />}
                      className="bg-background/40 border-border/50 h-14 rounded-2xl group-focus-within:border-primary/50 group-focus-within:ring-primary/20"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      error={errors.phoneNumber}
                      required
                    />
                  </div>

                  {/* Admission & Programme Selection */}
                  <div className="space-y-4 pt-2">
                    <div className="p-6 rounded-2xl bg-muted/40 border border-border/50">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <Menu className="h-4 w-4" /> Academic Selection
                      </h3>
                      <div className="space-y-4">
                        <ActiveAdmission
                          onSelect={setSelectedAdmissionId}
                          selectedId={selectedAdmissionId}
                          programmeType="ODEL"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Password */}
                    <div className="space-y-2">
                      <div className="relative group">
                        <FloatingInput
                          id="password"
                          name="password"
                          label="Password"
                          type={showPassword ? "text" : "password"}
                          disabled={isSubmitting}
                          icon={<Lock className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />}
                          className="bg-background/40 border-border/50 h-14 rounded-2xl pr-12 group-focus-within:border-primary/50 group-focus-within:ring-primary/20"
                          value={formData.password}
                          onChange={handleChange}
                          error={errors.password}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors z-20 h-10 w-10 flex items-center justify-center rounded-xl"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2 group">
                      <FloatingInput
                        id="confirmPassword"
                        name="confirmPassword"
                        label="Confirm Password"
                        type={showPassword ? "text" : "password"}
                        disabled={isSubmitting}
                        icon={<Lock className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />}
                        className="bg-background/40 border-border/50 h-14 rounded-2xl pr-12 group-focus-within:border-primary/50 group-focus-within:ring-primary/20"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                        required
                      />
                    </div>
                  </div>



                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 mt-4"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Account...
                      </div>
                    ) : (
                      "Register"
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex justify-center pb-8 border-t border-border/10 pt-6">
                <div className="text-xs font-medium text-muted-foreground">
                  Already a Student?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/api/auth/login")}
                    className="text-primary hover:underline ml-1 font-bold uppercase tracking-wide"
                  >
                    Login here
                  </button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;