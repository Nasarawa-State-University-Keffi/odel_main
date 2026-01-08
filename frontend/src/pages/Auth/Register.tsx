import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { FloatingInput } from "@/features/admin/components/admission/components/ui/floating-input";
import { Eye, EyeOff, Mail, Lock, User, Phone, Menu, Loader2 } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api";
import ActiveAdmission from "@/features/admin/components/admission/components/shared/ActiveAdmission";
import CourseList from "@/features/admin/components/admission/components/shared/CourseList";
import { Sheet, SheetContent, SheetTrigger } from "@/features/admin/components/admission/components/ui/sheet";
import odelLogo from '@/assets/odel-logo.jpg';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/features/admin/components/admission/components/ui/card";
import { applicantService } from "@/features/admin/services/applicantService";
import { modeOfEntryService } from "@/features/admin/services/modeOfEntryService";
import { ModeOfEntry } from "@/features/admin/types/modeOfEntry";
import { admissionService } from "@/features/admin/services/admissionService";
import { Admission } from "@/features/admin/types/admission";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/admin/components/admission/components/ui/select";
import { Label } from "@/features/admin/components/admission/components/ui/label";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    jambRegNumber: "",
  });

  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [modesOfEntry, setModesOfEntry] = useState<ModeOfEntry[]>([]);
  const [selectedModeOfEntryId, setSelectedModeOfEntryId] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    controls.start({ opacity: 1, y: 0 });
    // Fetch active admissions to have their details (like programmeType)
    const fetchAdmissions = async () => {
      try {
        const data = await admissionService.getActiveAdmissions();
        setAdmissions(data);
      } catch (err) {
        console.error("Failed to fetch admissions", err);
      }
    };
    fetchAdmissions();
  }, [controls]);

  // Update selected admission object and fetch modes of entry
  useEffect(() => {
    if (selectedAdmissionId) {
      const adm = admissions.find(a => a.id === selectedAdmissionId) || null;
      setSelectedAdmission(adm);

      if (adm?.applicationType?.programmeType?.id) {
        modeOfEntryService.getAllModeOfEntries(adm.applicationType.programmeType.id)
          .then(setModesOfEntry)
          .catch(console.error);
      } else {
        setModesOfEntry([]);
      }
      setSelectedModeOfEntryId("");
    }
  }, [selectedAdmissionId, admissions]);

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

    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!selectedAdmissionId) {
      toast({
        title: "Missing Selection",
        description: "Please select an admission cycle.",
        variant: "destructive",
      });
      isValid = false;
    }

    if (!selectedModeOfEntryId) {
      toast({
        title: "Missing Selection",
        description: "Please select a mode of entry.",
        variant: "destructive",
      });
      isValid = false;
    }

    if (!formData.jambRegNumber.trim()) {
      newErrors.jambRegNumber = "JAMB/Registration Number is required";
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
        admissionId: selectedAdmissionId as number,
        modeOfEntryId: Number(selectedModeOfEntryId),
        emailAddress: formData.email,
        jambRegNumber: formData.jambRegNumber
      };

      await applicantService.registerApplicant(submitData);

      toast({
        title: "Registration Successful",
        description: "Your application account has been created successfully.",
      });

      // Navigate to success or login (depending on flow, user said go on)
      // For now stay on page or navigate to login
      navigate("/api/auth/login");

    } catch (error: any) {
      const status = error.response?.status;
      let title = "Registration Failed";
      let description = error.response?.data?.message || "Something went wrong. Please try again.";

      if (status === 409) {
        title = "Duplicate Entry";
        description = "A student with this email or JAMB number already exists.";
      } else if (status === 400) {
        title = "Bad Request";
        description = error.response?.data?.message || "Invalid registration details.";
      } else if (status === 422) {
        title = "Incomplete Data";
        description = "Please check all fields and try again.";
      }

      toast({
        title,
        description,
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
                  {/* Only keeping fields required by the registration endpoint */}

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

                        {selectedAdmissionId && modesOfEntry.length > 0 && (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mode of Entry *</Label>
                            <Select value={selectedModeOfEntryId} onValueChange={setSelectedModeOfEntryId}>
                              <SelectTrigger className="h-14 rounded-2xl bg-background/40 border-border/50">
                                <SelectValue placeholder="Select Mode of Entry" />
                              </SelectTrigger>
                              <SelectContent>
                                {modesOfEntry.map(mode => (
                                  <SelectItem key={mode.id} value={mode.id.toString()}>
                                    {mode.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <FloatingInput
                            id="jambRegNumber"
                            name="jambRegNumber"
                            label="JAMB / Registration Number"
                            disabled={isSubmitting}
                            icon={<Menu className="h-4 w-4 text-muted-foreground" />}
                            className="bg-background/40 border-border/50 h-14 rounded-2xl"
                            value={formData.jambRegNumber}
                            onChange={handleChange}
                            error={errors.jambRegNumber}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Password fields removed as per new endpoint requirement which only takes 4 fields */}
                  {/* But I'll keep them if the user might still need them for login later? 
                      Wait, the new endpoint payload is ONLY:
                      {
                        "admissionId": 0,
                        "modeOfEntryId": 0,
                        "emailAddress": "string",
                        "jambRegNumber": "string"
                      }
                      So I should REMOVE firstName, lastName, phoneNumber, password, confirmPassword from the submission and maybe from the form if they aren't used.
                      However, many registration forms still want names. 
                      Let's stick to the requested payload.
                  */}

                  {/* Removed unused fields */}



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