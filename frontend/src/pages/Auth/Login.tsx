import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { motion, useAnimation } from "framer-motion";
import odelLogo from '@/assets/odel-logo.jpg';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

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
  const controls = useAnimation();

  useEffect(() => {
    controls.start({ opacity: 1, y: 0 });
  }, [controls]);

  const shakeForm = () => {
    controls.start({
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 }
    });
  };

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = (data: LoginForm) => {
    setIsLoading(true);
    setTimeout(() => {
      // Simulate login - redirect to application
      // If there's an error, you would call:
      // shakeForm();
      // setValue('password', '');
      navigate("/application");
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none z-0" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 w-full h-full sm:h-auto sm:max-w-md px-0 sm:px-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          transition={{ duration: 0.5 }}
          className="w-full h-full sm:h-auto"
        >
          <Card className="w-full h-[100dvh] sm:h-auto rounded-none sm:rounded-xl border-0 sm:border border-border/50 shadow-none sm:shadow-2xl bg-card/95 backdrop-blur-sm flex flex-col justify-center sm:block">
            <CardHeader className="space-y-1">
              <CardTitle className="text-center text-2xl font-semibold">
                <div className="mb-6 flex items-center justify-center gap-2">
                  <div className="inline-flex items-center justify-center mb-4">
                    <img src={odelLogo} alt="ODEL Logo" className="h-16" />
                  </div>
                </div>
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                  Welcome Back
                </div>
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Login to continue your learning journey
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <FloatingInput
                    id="email"
                    label="Email address / Applicant ID"
                    type="email"
                    icon={<Mail className="h-4 w-4" />}
                    {...register("email")}
                    className="bg-background/50"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <FloatingInput
                      id="password"
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      icon={<Lock className="h-4 w-4" />}
                      {...register("password")}
                      className="bg-background/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors z-20"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1">
                    <Link
                      to="/api/auth/forgot-password"
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold py-6 shadow-lg transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
              </div>

              <div className="flex items-center justify-between w-full text-sm">
                <div className="text-muted-foreground">
                  New Applicant?{" "}
                  <Link
                    to="/api/auth/register"
                    className="text-primary hover:underline font-medium"
                  >
                    Register here
                  </Link>
                </div>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;