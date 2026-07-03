import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, Loader2, Lock, User, ChevronRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AnimateIn } from "@/components/ui/animate-in";
import { useAuth } from "@/service/useAuth";
import { useNavigate } from "react-router-dom";

const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { isPending, handleSignin } = useAuth()
  const navigate = useNavigate()

  // 2. Initialize the form with Zod integration
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // 3. Handle the submission
  const onSubmit = async (data: LoginFormValues) => {
    handleSignin(data)
    setTimeout(() => {
      navigate("/application")
    }, 1000)
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 bg-white dark:bg-zinc-950">


      <div className="hidden relative flex-col lg:flex justify-between overflow-hidden">

        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-zinc-950/60 mix-blend-multiply" />
        {/* Gradient fade from bottom to top */}
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-transparent" />

        {/* Logo */}
        <AnimateIn direction="down" className="relative z-20 p-10">
          <div className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            LMS Portal
          </div>
        </AnimateIn>

        {/* Decorative Graphic */}
        <AnimateIn direction="up" delay={0.4} className="relative z-20 p-10 mt-auto">
          <blockquote className="space-y-6">
            <p className="text-4xl text-white font-medium leading-tight font-heading tracking-tight">
              "Empowering the next generation of innovators with borderless education."
            </p>
            <footer className="text-sm text-emerald-400 font-medium">
              Nasarawa State University, Keffi &copy; 2026
            </footer>
          </blockquote>
        </AnimateIn>
      </div>

      {/*The Login Form */}
      <div className="flex items-center justify-center p-8 lg:p-12 relative">

        {/* Subtle background glow for the form side */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="mx-auto w-full max-w-[420px] space-y-8 relative z-10">

          {/* Mobile Logo (Only shows on small screens) */}
          <div className="flex lg:hidden items-center gap-3 text-2xl font-bold tracking-tight mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            LMS Portal
          </div>

          <AnimateIn delay={0.1} direction="up" className="space-y-2 text-left">
            <h1 className="text-3xl font-heading font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Enter your credentials to access your dashboard.
            </p>
          </AnimateIn>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Username Field */}
              <AnimateIn delay={0.2} direction="up">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-900 dark:text-zinc-300">Matriculation / Application No.</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <div className="absolute left-3 top-3 text-zinc-400 transition-colors group-focus-within:text-emerald-500">
                            <User className="w-[18px] h-[18px]" />
                          </div>
                          <Input
                            placeholder="e.g. NSUK/2026/001"
                            className="pl-10 h-12 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500 rounded-xl transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AnimateIn>

              {/* Password Field */}
              <AnimateIn delay={0.3} direction="up">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-zinc-900 dark:text-zinc-300">Password</FormLabel>
                        <a href="#" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium transition-colors">
                          Forgot password?
                        </a>
                      </div>
                      <FormControl>
                        <div className="relative group">
                          <div className="absolute left-3 top-3 text-zinc-400 transition-colors group-focus-within:text-emerald-500">
                            <Lock className="w-[18px] h-[18px]" />
                          </div>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="pl-10 h-12 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500 rounded-xl transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AnimateIn>

              {/* Submit Button */}
              <AnimateIn delay={0.4} direction="up">
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-4"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </AnimateIn>

            </form>
          </Form>

          {/* Footer links */}
          <AnimateIn delay={0.5} direction="up">
            <p className="text-center text-sm text-zinc-500 mt-8">
              Need help logging in? <a href="#" className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4 transition-all">Contact IT Support</a>
            </p>
          </AnimateIn>

        </div>
      </div>
    </div>
  );
};

export default Login;