import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import WhatsappFloat from "@/components/WhatsappFloat";
import Header from "@/components/Header";

const loginSchema = z.object({
  email: z.string().email("Valid email or Applicant ID is required").min(1, "Email or Applicant ID is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isValid } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = (data: LoginForm) => {
    setIsLoading(true);
    setTimeout(() => {
      // Simulate login - redirect to application
      navigate("/application");
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/*header*/}
      <Header />
      {/*whatsapp floating*/}

      <WhatsappFloat />

      <div className="flex items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader size="lg" />
                <p className="text-muted-foreground mt-4">Logging in...</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-6">Login</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <FloatingInput
                    label="Email address / Applicant ID"
                    type="email"
                    icon={<Mail className="h-4 w-4" />}
                    {...register("email")}
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}

                  <div className="relative">
                    <FloatingInput
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      icon={<Lock className="h-4 w-4" />}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      Not registered?{" "}
                      <Link to="/register" className="text-teal-600 hover:underline font-medium">
                        Register
                      </Link>
                    </div>
                    <Link to="/forgot-password" className="text-teal-600 hover:underline font-medium">
                      Forgot Password?
                    </Link>
                  </div>

                  <Button type="submit" className="w-full" disabled={!isValid || isLoading}>
                    Login
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;